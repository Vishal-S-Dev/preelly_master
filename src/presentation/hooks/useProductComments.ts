import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CommentApi } from '../../data/api/CommentApi';
import { CommentDTO } from '../../data/dto/CommentDTO';
import { ProductComment, CommentAuthor } from '../../domain/models/ProductComment';
import { useAppSelector } from './useRedux';

const mapComment = (dto: CommentDTO, likedIds: Set<string>, ownerUserId?: string): ProductComment => {
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

  const replies = (dto.replies ?? []).map(reply =>
    mapComment(reply, likedIds, ownerUserId),
  );

  return {
    id,
    text: dto.text,
    createdAt: dto.createdAt,
    user: author,
    likeCount,
    isLiked: likedIds.has(id),
    replies,
    replyCount: dto.replyCount ?? replies.length,
  };
};

const formatTimeAgo = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'now';
};

export const useProductComments = (productId: string | null) => {
  const authUser = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(
    state => state.auth.isAuthenticated && !state.auth.isGuest,
  );

  const [comments, setComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const listVersion = useRef(0);

  const refreshComments = useCallback(async () => {
    if (!productId) {
      return;
    }
    setLoading(true);
    try {
      const response = await CommentApi.getComments(productId);
      const liked = new Set<string>();
      if (authUser?.id) {
        response.forEach(comment => {
          const id = comment._id ?? comment.id;
          if (
            id &&
            Array.isArray(comment.likes) &&
            comment.likes.some(likeId => String(likeId) === authUser.id)
          ) {
            liked.add(id);
          }
        });
      }
      setLikedIds(liked);
      setComments(
        response.map(item => mapComment(item, liked, undefined)),
      );
      listVersion.current += 1;
    } catch {
      Alert.alert('Comments', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, productId]);

  useEffect(() => {
    if (productId) {
      refreshComments();
    } else {
      setComments([]);
    }
  }, [productId, refreshComments]);

  const submitComment = useCallback(
    async (text: string) => {
      if (!productId) {
        return false;
      }
      if (!isAuthenticated) {
        Alert.alert('Comments', 'Please login to comment');
        return false;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      setSubmitting(true);
      try {
        const created = await CommentApi.addComment(productId, trimmed);
        const mapped = mapComment(created, likedIds);
        setComments(prev => [mapped, ...prev]);
        listVersion.current += 1;
        return true;
      } catch {
        Alert.alert('Comments', 'Failed to add comment');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [isAuthenticated, likedIds, productId],
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated) {
        Alert.alert('Comments', 'Please login to like');
        return;
      }
      try {
        const result = await CommentApi.likeComment(commentId);
        setLikedIds(prev => {
          const next = new Set(prev);
          if (result.liked) {
            next.add(commentId);
          } else {
            next.delete(commentId);
          }
          return next;
        });
        setComments(prev =>
          prev.map(comment => {
            const updateTree = (item: ProductComment): ProductComment => {
              if (item.id === commentId) {
                return {
                  ...item,
                  isLiked: result.liked,
                  likeCount: result.likeCount || item.likeCount,
                };
              }
              return {
                ...item,
                replies: item.replies.map(updateTree),
              };
            };
            return updateTree(comment);
          }),
        );
      } catch {
        // silent – mirrors web behavior on like failures
      }
    },
    [isAuthenticated],
  );

  return {
    comments,
    loading,
    submitting,
    isAuthenticated,
    authUser,
    refreshComments,
    submitComment,
    toggleLike,
    formatTimeAgo,
    listVersion: listVersion.current,
  };
};
