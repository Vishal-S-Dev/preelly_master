import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../services/search.service';

export const usePopularListings = (limit = 8) =>
  useQuery({
    queryKey: ['search', 'popular-listings', limit],
    queryFn: () => searchService.getPopularListings(limit),
    staleTime: 2 * 60_000,
    retry: 1,
  });
