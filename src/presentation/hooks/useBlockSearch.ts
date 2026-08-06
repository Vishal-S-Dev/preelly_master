import { useCallback, useEffect, useMemo, useState } from 'react';
import { userSafetyService } from '../../services/userSafety.service';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';
import { BlockSearchResultListing, UserSearchResultDTO } from '../../types/blockedUsers.types';

const SEARCH_DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 30;

const roleLabelOf = (role?: string): string => {
  if (role === 'admin' || role === 'super_admin') {
    return 'Admin';
  }
  if (role === 'dealer' || role === 'seller') {
    return 'Dealer';
  }
  return 'Member';
};

const mapSearchResult = (dto: UserSearchResultDTO): BlockSearchResultListing => {
  const name = dto.displayName?.trim() || dto.name?.trim() || 'User';
  return {
    id: dto._id,
    name,
    avatarUri: getDisplayAvatarUri(dto.avatar, name),
    roleLabel: roleLabelOf(dto.role),
  };
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim() ? error.message.trim() : fallback;

/** Mirrors web's SearchContactsToBlockModal: 280ms debounce, 3-char minimum, exclude already-blocked ids. */
export const useBlockSearch = (excludeIds: string[]) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlockSearchResultListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await userSafetyService.searchUsers(trimmed, RESULT_LIMIT);
        if (cancelled) {
          return;
        }
        const excluded = new Set(excludeIds);
        setResults(response.users.filter(u => !excluded.has(u._id)).map(mapSearchResult));
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to search users'));
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [excludeIds, query]);

  const clear = useCallback(() => setQuery(''), []);

  return useMemo(
    () => ({
      query,
      setQuery,
      results,
      loading,
      error,
      isBelowMinLength: query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH,
      clear,
    }),
    [clear, error, loading, query, results],
  );
};
