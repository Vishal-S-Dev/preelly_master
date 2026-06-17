import { useQuery } from '@tanstack/react-query';
import { filterService } from '../../services/filterService';
import { isMongoObjectId } from '../../utils/mongoId';

export const useDynamicFilters = (subcategoryId?: string) =>
  useQuery({
    queryKey: ['filters', 'dynamic', subcategoryId],
    queryFn: () => filterService.getDynamicFilters(subcategoryId as string),
    enabled: Boolean(subcategoryId && isMongoObjectId(subcategoryId)),
    staleTime: 5 * 60_000,
    retry: 1,
  });
