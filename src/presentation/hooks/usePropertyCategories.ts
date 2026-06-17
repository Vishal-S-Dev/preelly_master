import { useQuery } from '@tanstack/react-query';
import { CategoryApi } from '../../data/api/categoryApi';

export const usePropertyCategories = (enabled: boolean) =>
  useQuery({
    queryKey: ['categories', 'property'],
    enabled,
    queryFn: () => CategoryApi.getPropertyCategories(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
