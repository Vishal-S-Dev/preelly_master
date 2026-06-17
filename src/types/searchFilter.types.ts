export interface SearchFilterParams {
  keyword?: string;
  city?: string;
  categoryId?: string;
  subCategoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: string;
  yearFrom?: string;
  yearTo?: string;
  maxKilometers?: string;
  minKilometers?: number;
  makeModelId?: string;
  trimId?: string;
  emirates?: string[];
  dynamicFilters?: Record<string, string | string[]>;
}

export type SearchSortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export interface ProductSearchQuery extends SearchFilterParams {
  page?: number;
  limit?: number;
  sort?: SearchSortOption;
}

export interface ProductSearchPage {
  items: import('./search.types').SearchListingItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const SEARCH_SORT_OPTIONS: { id: SearchSortOption; label: string }[] = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price Low → High' },
  { id: 'price_desc', label: 'Price High → Low' },
  { id: 'popular', label: 'Most Popular' },
];

export const SEARCH_PAGE_LIMIT = 20;
