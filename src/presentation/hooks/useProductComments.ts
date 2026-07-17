import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CommentApi } from '../../data/api/CommentApi';
import { ProductComment } from '../../domain/models/ProductComment';
import {
  buildCommentTree,
  collectLikedCommentIds,
  insertCommentInTree,
  mapCommentDto,
  updateCommentInTree,
} from '../../utils/commentTreeUtils';
import { useAppSelector } from './useRedux';

export type CommentReplyTarget = {
  id: string;
  username: string;
} | null;

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
      const liked = authUser?.id
        ? collectLikedCommentIds(response, authUser.id)
        : new Set<string>();
      setLikedIds(liked);
      setComments(buildCommentTree(response, liked, undefined));
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
    async (text: string, parentID?: string | null) => {
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
        const created = await CommentApi.addComment(productId, trimmed, parentID);
        const mapped = mapCommentDto(
          {
            ...created,
            parentID: created.parentID ?? parentID ?? null,
            parentComment: created.parentComment ?? parentID ?? null,
          },
          likedIds,
        );
        mapped.parentId = parentID ?? mapped.parentId ?? null;

        setComments(prev => insertCommentInTree(prev, mapped, parentID ?? null));
        listVersion.current += 1;
        return true;
      } catch {
        Alert.alert('Comments', parentID ? 'Failed to add reply' : 'Failed to add comment');
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
          updateCommentInTree(prev, commentId, item => ({
            ...item,
            isLiked: result.liked,
            likeCount:
              typeof result.likeCount === 'number' && result.likeCount > 0
                ? result.likeCount
                : result.liked
                  ? item.likeCount + 1
                  : Math.max(0, item.likeCount - 1),
          })),
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
