import { useInfiniteQuery } from '@tanstack/react-query';
import { productSearchService } from '../../services/productSearchService';
import { SearchListingItem } from '../../types/search.types';
import {
  ProductSearchQuery,
  SEARCH_PAGE_LIMIT,
  SearchSortOption,
} from '../../types/searchFilter.types';

export const useSearchProducts = (
  filters: Omit<ProductSearchQuery, 'page' | 'limit' | 'sort'>,
  sort: SearchSortOption,
) =>
  useInfiniteQuery({
    queryKey: ['search', 'products', filters, sort],
    queryFn: ({ pageParam }) =>
      productSearchService.searchProducts({
        ...filters,
        sort,
        page: pageParam,
        limit: SEARCH_PAGE_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 30_000,
    retry: 1,
  });

export const flattenSearchPages = (
  pages: { items: SearchListingItem[] }[] | undefined,
): SearchListingItem[] => pages?.flatMap(page => page.items) ?? [];

export const getSearchTotal = (
  pages: { total: number }[] | undefined,
): number => pages?.[0]?.total ?? 0;
