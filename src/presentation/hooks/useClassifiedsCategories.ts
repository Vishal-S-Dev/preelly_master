import { useQuery } from '@tanstack/react-query';
import { CategoryApi } from '../../data/api/categoryApi';

export const useClassifiedsCategories = (enabled: boolean) =>
  useQuery({
    queryKey: ['categories', 'classifieds'],
    enabled,
    queryFn: () => CategoryApi.getClassifiedsCategories(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
