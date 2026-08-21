import { useEffect, useMemo, useState } from 'react';
import { userSafetyService } from '../../services/userSafety.service';
import { ShareRecipient } from '../../types/share.types';
import { UserSearchResultDTO } from '../../types/blockedUsers.types';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 20;

const mapSearchResult = (dto: UserSearchResultDTO): ShareRecipient => {
  const name = dto.displayName?.trim() || dto.name?.trim() || 'User';
  return {
    id: dto._id,
    name,
    username: dto.displayName ?? dto.name ?? '',
    avatarUrl: getDisplayAvatarUri(dto.avatar, name) ?? undefined,
    kind: 'user',
  };
};

/** Instagram-style "search any user" for the Share sheet — mirrors web's ReelShareModal and this
 * app's own useBlockSearch: 3-char minimum, 300ms debounce, GET /api/user/search. Results exclude
 * anyone already visible in the followers/following section to avoid duplicate rows. */
export const useShareUserSearch = (query: string, excludeIds: string[]) => {
  const [results, setResults] = useState<ShareRecipient[]>([]);
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
          setError(err instanceof Error ? err.message : 'Failed to search users');
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
    // excludeIds intentionally omitted — it's a derived array that changes identity every render;
    // only `query` should restart the debounce timer, and the latest excludeIds is still read
    // (freshly, via closure) once the timer actually fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return useMemo(
    () => ({
      results,
      loading,
      error,
      isBelowMinLength: query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH,
    }),
    [error, loading, query, results],
  );
};
