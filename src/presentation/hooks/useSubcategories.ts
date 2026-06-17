import { useQuery } from '@tanstack/react-query';
import {
  CREATE_POST_SUBCATEGORIES,
  DYNAMIC_FORM_CATEGORY_ID_BY_SLUG,
} from '../../constants/createPostConstants';
import { CategoryApi } from '../../data/api/categoryApi';
import { Category } from '../../types/category.types';
import { resolveCategoryIdToObjectId } from '../../utils/resolveProductCategoryIds';

const mapFallback = (parentId: string): Category[] =>
  (CREATE_POST_SUBCATEGORIES[parentId] ?? []).map((item, index) => ({
    _id: DYNAMIC_FORM_CATEGORY_ID_BY_SLUG[item.id] ?? item.id,
    name: item.name,
    slug: item.id,
    parentId,
    order: index,
  }));

export const useSubcategories = (parentId?: string) => {
  const resolvedParentId = resolveCategoryIdToObjectId(parentId) ?? parentId;

  return useQuery({
    queryKey: ['categories', 'children', resolvedParentId],
    enabled: Boolean(resolvedParentId),
    queryFn: async () => {
      if (!resolvedParentId) {
        return [];
      }
      try {
        const remote = await CategoryApi.getSubcategories(resolvedParentId);
        return remote.length ? remote : mapFallback(parentId ?? resolvedParentId);
      } catch {
        return mapFallback(parentId ?? resolvedParentId);
      }
    },
    staleTime: 5 * 60_000,
  });
};
