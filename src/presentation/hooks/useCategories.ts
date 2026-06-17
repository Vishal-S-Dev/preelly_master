import { useQuery } from '@tanstack/react-query';
import {
  CREATE_POST_CATEGORIES,
  DYNAMIC_FORM_CATEGORY_ID_BY_SLUG,
} from '../../constants/createPostConstants';
import { CategoryApi } from '../../data/api/categoryApi';
import { Category } from '../../types/category.types';

const mapFallback = (): Category[] =>
  CREATE_POST_CATEGORIES.map((item, index) => ({
    _id: DYNAMIC_FORM_CATEGORY_ID_BY_SLUG[item.id] ?? item.id,
    name: item.name,
    slug: item.id,
    icon: item.icon,
    order: index,
  }));

export const useCategories = () =>
  useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: async () => {
      try {
        const remote = await CategoryApi.getRootCategories();
        return remote.length ? remote : mapFallback();
      } catch {
        return mapFallback();
      }
    },
    staleTime: 5 * 60_000,
  });
