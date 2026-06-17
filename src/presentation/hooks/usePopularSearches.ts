import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../services/search.service';

export const usePopularSearches = (limit = 10) =>
  useQuery({
    queryKey: ['search', 'popular', limit],
    queryFn: () => searchService.getPopularSearches(limit),
    staleTime: 5 * 60_000,
    retry: 1,
  });
