import { CommentDTO } from '../data/dto/CommentDTO';
import { ProductComment, CommentAuthor } from '../domain/models/ProductComment';

const resolveId = (value?: string | { _id?: string; id?: string } | null): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  const nested = value._id ?? value.id;
  return nested?.trim() || null;
};

const resolveParentId = (dto: CommentDTO): string | null =>
  resolveId(dto.parentID) ?? resolveId(dto.parentComment);

export const mapCommentDto = (
  dto: CommentDTO,
  likedIds: Set<string>,
  ownerUserId?: string,
): ProductComment => {
  const id = dto._id ?? dto.id ?? `comment_${Math.random()}`;
  const userId = dto.user?._id ?? dto.user?.id ?? 'unknown';
  const likeCount =
    typeof dto.likeCount === 'number'
      ? dto.likeCount
      : Array.isArray(dto.likes)
        ? dto.likes.length
        : 0;

  const author: CommentAuthor = {
    id: userId,
    name: dto.user?.name || dto.user?.username || 'User',
    username: dto.user?.username,
    avatar: dto.user?.avatar ?? undefined,
    isOwner: Boolean(dto.isOwner) || (ownerUserId ? userId === ownerUserId : false),
    isPinned: Boolean(dto.isPinned),
  };

  return {
    id,
    text: dto.text,
    createdAt: dto.createdAt,
    user: author,
    likeCount,
    isLiked: likedIds.has(id),
    replies: [],
    replyCount: 0,
    parentId: resolveParentId(dto),
  };
};

const sortByCreatedAsc = (a: ProductComment, b: ProductComment) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const sortByCreatedDesc = (a: ProductComment, b: ProductComment) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const sortReplyTree = (comment: ProductComment) => {
  comment.replies.sort(sortByCreatedAsc);
  comment.replyCount = comment.replies.length;
  comment.replies.forEach(sortReplyTree);
};

/**
 * Builds a nested comment tree from a flat API list using `parentID` / `parentComment`.
 * Roots: parentID null · Replies nest under their parent recursively.
 */
export const buildCommentTree = (
  flat: CommentDTO[],
  likedIds: Set<string>,
  ownerUserId?: string,
): ProductComment[] => {
  if (!flat.length) {
    return [];
  }

  const nodes = new Map<string, ProductComment>();
  const order: string[] = [];

  flat.forEach(dto => {
    const mapped = mapCommentDto(dto, likedIds, ownerUserId);
    // Prefer nested replies from payload when present (legacy), then re-parent via flat ids.
    const nestedFromPayload = (dto.replies ?? []).map(reply =>
      mapCommentDto(reply, likedIds, ownerUserId),
    );
    mapped.replies = nestedFromPayload;
    mapped.replyCount = nestedFromPayload.length;
    nodes.set(mapped.id, mapped);
    order.push(mapped.id);
  });

  const roots: ProductComment[] = [];
  const orphanReplies: ProductComment[] = [];

  order.forEach(id => {
    const node = nodes.get(id);
    if (!node) {
      return;
    }

    const parentId = node.parentId;
    if (parentId && nodes.has(parentId) && parentId !== id) {
      const parent = nodes.get(parentId)!;
      // Avoid duplicating if already present via nested `replies` payload
      if (!parent.replies.some(r => r.id === node.id)) {
        parent.replies.push(node);
      }
      parent.replyCount = parent.replies.length;
      return;
    }

    if (parentId && !nodes.has(parentId)) {
      orphanReplies.push(node);
      return;
    }

    roots.push(node);
  });

  roots.sort(sortByCreatedDesc);
  roots.forEach(sortReplyTree);
  orphanReplies.sort(sortByCreatedDesc);
  orphanReplies.forEach(sortReplyTree);

  return [...roots, ...orphanReplies];
};

export const insertCommentInTree = (
  comments: ProductComment[],
  comment: ProductComment,
  parentId?: string | null,
): ProductComment[] => {
  if (!parentId) {
    return [comment, ...comments];
  }

  let inserted = false;

  const walk = (items: ProductComment[]): ProductComment[] =>
    items.map(item => {
      if (item.id === parentId) {
        inserted = true;
        const replies = [...item.replies, comment];
        return {
          ...item,
          replies,
          replyCount: replies.length,
        };
      }
      if (item.replies.length === 0) {
        return item;
      }
      return {
        ...item,
        replies: walk(item.replies),
      };
    });

  const next = walk(comments);
  return inserted ? next : [comment, ...comments];
};

export const updateCommentInTree = (
  comments: ProductComment[],
  commentId: string,
  updater: (item: ProductComment) => ProductComment,
): ProductComment[] =>
  comments.map(item => {
    if (item.id === commentId) {
      return updater(item);
    }
    if (item.replies.length === 0) {
      return item;
    }
    return {
      ...item,
      replies: updateCommentInTree(item.replies, commentId, updater),
    };
  });

export const collectLikedCommentIds = (
  flat: CommentDTO[],
  userId: string,
): Set<string> => {
  const liked = new Set<string>();
  const visit = (items: CommentDTO[]) => {
    items.forEach(comment => {
      const id = comment._id ?? comment.id;
      if (
        id &&
        Array.isArray(comment.likes) &&
        comment.likes.some(likeId => {
          if (typeof likeId === 'string') {
            return likeId === userId;
          }
          return String(likeId?._id ?? '') === userId;
        })
      ) {
        liked.add(id);
      }
      if (comment.replies?.length) {
        visit(comment.replies);
      }
    });
  };
  visit(flat);
  return liked;
};

export const countCommentsInTree = (comments: ProductComment[]): number =>
  comments.reduce((sum, item) => sum + 1 + countCommentsInTree(item.replies), 0);
