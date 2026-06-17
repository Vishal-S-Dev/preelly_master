import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { RECENT_SEARCHES_LIMIT } from '../../constants/searchConstants';
import { storage } from '../../utils/storage';

const parseRecentSearches = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
};

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    storage.getString(STORAGE_KEYS.RECENT_SEARCHES).then(raw => {
      if (mounted) {
        setRecentSearches(parseRecentSearches(raw));
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (items: string[]) => {
    setRecentSearches(items);
    await storage.setString(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(items));
  }, []);

  const addRecentSearch = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        return;
      }
      const next = [trimmed, ...recentSearches.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        RECENT_SEARCHES_LIMIT,
      );
      await persist(next);
    },
    [persist, recentSearches],
  );

  const removeRecentSearch = useCallback(
    async (keyword: string) => {
      const next = recentSearches.filter(item => item !== keyword);
      await persist(next);
    },
    [persist, recentSearches],
  );

  const clearRecentSearches = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return {
    recentSearches,
    loaded,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
};
