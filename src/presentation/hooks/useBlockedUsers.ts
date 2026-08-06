import { useCallback, useEffect, useMemo, useState } from 'react';
import { userSafetyService } from '../../services/userSafety.service';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';
import { BlockedUserDTO, BlockedUserListing } from '../../types/blockedUsers.types';

const LIMIT = 20;

const formatBlockedOn = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const mapBlockedUser = (dto: BlockedUserDTO): BlockedUserListing => {
  const name = dto.displayName?.trim() || dto.name?.trim() || 'User';
  return {
    id: dto._id,
    name,
    avatarUri: getDisplayAvatarUri(dto.avatar, name),
    usernameLabel: dto.email ? `@${dto.email.split('@')[0]}` : null,
    blockedOnLabel: formatBlockedOn(dto.blockedAt),
  };
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim() ? error.message.trim() : fallback;

export const useBlockedUsers = () => {
  const [items, setItems] = useState<BlockedUserListing[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, mode: 'replace' | 'append' | 'refresh') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else if (mode === 'replace') {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const result = await userSafetyService.getBlockedUsers({ page: nextPage, limit: LIMIT });
        const mapped = (result.items ?? result.blockedUsers ?? []).map(mapBlockedUser);
        setPage(result.page);
        setTotal(result.total);
        setHasMore(Boolean(result.hasMore));
        setItems(prev => (mode === 'append' ? [...prev, ...mapped] : mapped));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load blocked users'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, 'replace');
  }, [load]);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    load(page + 1, 'append');
  }, [hasMore, load, loading, loadingMore, page]);

  const unblock = useCallback(async (id: string): Promise<{ message: string }> => {
    setBusyId(id);
    try {
      const result = await userSafetyService.unblockUser(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      return { message: result.message };
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to unblock user'));
    } finally {
      setBusyId(null);
    }
  }, []);

  /** Optimistically prepend a freshly-blocked user, mirroring web's local-state update. */
  const addBlockedUser = useCallback((user: BlockedUserListing) => {
    setItems(prev => [user, ...prev.filter(item => item.id !== user.id)]);
    setTotal(prev => prev + 1);
  }, []);

  return useMemo(
    () => ({
      items,
      total,
      loading,
      refreshing,
      loadingMore,
      error,
      hasMore,
      busyId,
      refresh,
      loadMore,
      unblock,
      addBlockedUser,
      reload: () => load(1, 'replace'),
    }),
    [
      addBlockedUser,
      busyId,
      error,
      hasMore,
      items,
      load,
      loading,
      loadingMore,
      refresh,
      loadMore,
      refreshing,
      total,
      unblock,
    ],
  );
};
