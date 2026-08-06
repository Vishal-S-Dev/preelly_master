import { SearchFilterParams, SearchSortOption } from '../types/searchFilter.types';
import { CreateSavedSearchPayload } from '../types/savedSearch.types';

/** Builds the /user/saved-searches URL from filter params, mirroring web's query-string shape. */
export const buildSearchUrl = (filters: SearchFilterParams, sort: SearchSortOption): string => {
  const params: Array<[string, string]> = [];
  if (filters.keyword?.trim()) params.push(['q', filters.keyword.trim()]);
  if (filters.categoryId) params.push(['categoryId', filters.categoryId]);
  if (filters.subCategoryId) params.push(['subCategoryId', filters.subCategoryId]);
  if (filters.city && filters.city !== 'All Cities') params.push(['city', filters.city]);
  if (typeof filters.minPrice === 'number') params.push(['minPrice', String(filters.minPrice)]);
  if (typeof filters.maxPrice === 'number') params.push(['maxPrice', String(filters.maxPrice)]);
  if (filters.emirates?.length) params.push(['emirates', filters.emirates.join(',')]);
  if (sort !== 'newest') params.push(['sort', sort]);

  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `/search?${query}` : '/search';
};

/** Mirrors web's buildResultsSearchSavePayload (persistSavedSearch.js). */
export const buildSavedSearchPayload = (
  filters: SearchFilterParams,
  sort: SearchSortOption,
  resultLabel: string,
  isLoggedIn: boolean,
): CreateSavedSearchPayload => {
  const pathNames = [filters.categoryName, filters.subCategoryName]
    .map(name => name?.trim())
    .filter((name): name is string => Boolean(name));
  const catName = filters.categoryName?.trim() || filters.keyword?.trim() || resultLabel || 'Search';
  const queryText = filters.keyword?.trim() || '';

  const tags: string[] = [];
  tags.push(filters.city && filters.city !== 'All Cities' ? filters.city.toUpperCase() : 'ALL CITIES');
  if (filters.minPrice || filters.maxPrice) {
    tags.push(`PRICE: ${filters.minPrice ?? '0'}–${filters.maxPrice ?? '∞'}`);
  }
  if (sort !== 'newest') {
    tags.push(`SORT: ${sort.toUpperCase()}`);
  }

  return {
    title: `My ${catName} Search`,
    searchName: `My ${catName} Search`,
    categoryPath: pathNames.length ? pathNames : [catName],
    categoryId: filters.categoryId ?? null,
    categoryName: pathNames[0] ?? catName,
    subcategoryId: filters.subCategoryId ?? null,
    subCategoryId: filters.subCategoryId ?? null,
    subCategoryName: pathNames[1] ?? '',
    query: queryText,
    keyword: queryText,
    searchType: filters.categoryId && queryText ? 'mixed' : filters.categoryId ? 'category' : 'keyword',
    filters: {
      location: filters.city && filters.city !== 'All Cities' ? filters.city : '',
      minPrice: filters.minPrice != null ? String(filters.minPrice) : '',
      maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : '',
      sortBy: sort,
      tags,
      extra: {},
    },
    selectedFilters: {
      location: filters.city ?? '',
      minPrice: filters.minPrice ?? '',
      maxPrice: filters.maxPrice ?? '',
      sortBy: sort,
      tags,
      categoryId: filters.categoryId ?? null,
      subcategoryId: filters.subCategoryId ?? null,
    },
    sortOption: sort,
    location: filters.city && filters.city !== 'All Cities' ? filters.city : '',
    searchUrl: buildSearchUrl(filters, sort),
    notifyEnabled: true,
    notificationEnabled: true,
    emailNotificationEnabled: true,
    pushNotificationEnabled: true,
    platform: 'mobile',
    isLoggedIn,
  };
};
