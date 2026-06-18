import { useQuery } from '@tanstack/react-query';
import { filterService } from '../../services/filterService';
import { resolveCategoryIdToObjectId } from '../../utils/resolveProductCategoryIds';
import { isMongoObjectId } from '../../utils/mongoId';

export const useDynamicFilters = (subcategoryId?: string) => {
  const resolvedSubcategoryId = resolveCategoryIdToObjectId(subcategoryId) ?? subcategoryId;

  return useQuery({
    queryKey: ['filters', 'dynamic', resolvedSubcategoryId],
    queryFn: () => filterService.getDynamicFilters(resolvedSubcategoryId as string),
    enabled: Boolean(resolvedSubcategoryId && isMongoObjectId(resolvedSubcategoryId)),
    staleTime: 5 * 60_000,
    retry: 1,
  });
};
