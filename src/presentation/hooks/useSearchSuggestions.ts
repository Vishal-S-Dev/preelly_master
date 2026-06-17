import { useQuery } from '@tanstack/react-query';
import {
  SEARCH_SUGGESTIONS_DEBOUNCE_MS,
  SEARCH_SUGGESTIONS_MIN_LENGTH,
} from '../../constants/searchConstants';
import { searchService } from '../../services/search.service';
import { useDebouncedValue } from './useDebouncedValue';

export const useSearchSuggestions = (keyword: string, limit = 10) => {
  const debouncedKeyword = useDebouncedValue(keyword.trim(), SEARCH_SUGGESTIONS_DEBOUNCE_MS);
  const enabled = debouncedKeyword.length >= SEARCH_SUGGESTIONS_MIN_LENGTH;

  return useQuery({
    queryKey: ['search', 'suggestions', debouncedKeyword, limit],
    queryFn: () => searchService.getSuggestions(debouncedKeyword, limit),
    enabled,
    staleTime: 60_000,
    retry: 1,
    placeholderData: previous => previous,
  });
};
