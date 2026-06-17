import { useCallback, useEffect, useMemo, useState } from 'react';
import { FollowersApi } from '../../data/api/FollowersApi';
import { ShareRecipient } from '../../types/share.types';

const normalize = (value: string) => value.trim().toLowerCase();

export const useShareFollowers = (userId: string | null, enabled: boolean) => {
  const [followers, setFollowers] = useState<ShareRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    if (!userId) {
      setFollowers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await FollowersApi.getFollowers(userId);
      setFollowers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load followers');
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }
    load();
  }, [enabled, userId, load]);

  const filteredFollowers = useMemo(() => {
    const q = normalize(debouncedQuery);
    if (!q) {
      return followers;
    }
    return followers.filter(item => {
      const name = normalize(item.name);
      const username = normalize(item.username);
      return name.includes(q) || username.includes(q) || item.id.includes(q);
    });
  }, [followers, debouncedQuery]);

  return {
    followers: filteredFollowers,
    totalCount: followers.length,
    loading,
    error,
    query,
    setQuery,
    retry: load,
  };
};
