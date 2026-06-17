import { useQuery } from '@tanstack/react-query';
import { filterService } from '../../services/filterService';

export const useEmirates = () =>
  useQuery({
    queryKey: ['filters', 'emirates'],
    queryFn: () => filterService.getEmirates(),
    staleTime: 10 * 60_000,
    retry: 1,
  });
