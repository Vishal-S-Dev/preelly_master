import { useCallback, useEffect, useMemo, useState } from 'react';
import { FollowersApi } from '../../data/api/FollowersApi';
import { ShareRecipient } from '../../types/share.types';

const normalize = (value: string) => value.trim().toLowerCase();

const mergeRecipients = (
  followers: ShareRecipient[],
  following: ShareRecipient[],
): ShareRecipient[] => {
  const map = new Map<string, ShareRecipient>();
  followers.forEach(item => map.set(item.id, item));
  following.forEach(item => {
    const existing = map.get(item.id);
    map.set(item.id, existing ? { ...existing, ...item } : item);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

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
      const [followersList, followingList] = await Promise.all([
        FollowersApi.getFollowers(userId),
        FollowersApi.getFollowing(userId),
      ]);
      setFollowers(mergeRecipients(followersList, followingList));
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
    void load();
  }, [enabled, userId, load]);

  useEffect(() => {
    if (!enabled) {
      setFollowers([]);
      setLoading(false);
      setError(null);
      setQuery('');
    }
  }, [enabled, setQuery]);

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
