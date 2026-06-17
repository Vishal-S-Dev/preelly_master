import { useQuery } from '@tanstack/react-query';
import { DynamicFormApi } from '../../data/api/dynamicFormApi';
import { isMongoObjectId } from '../../utils/mongoId';

export const DYNAMIC_FORM_QUERY_KEY = 'dynamicForm';

export const useDynamicForm = (categoryId?: string) =>
  useQuery({
    queryKey: [DYNAMIC_FORM_QUERY_KEY, categoryId],
    queryFn: () => DynamicFormApi.getByCategoryId(categoryId as string),
    enabled: isMongoObjectId(categoryId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
