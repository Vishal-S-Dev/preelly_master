import { CategoryFilterPayload } from '../../../types/categoryFilter.types';
import { SearchFilterParams } from '../../../types/searchFilter.types';

export const isMotorsCategory = (name?: string): boolean =>
  name?.trim().toLowerCase() === 'motors';

export const payloadToSearchFilters = (
  payload: CategoryFilterPayload,
  keyword?: string,
): SearchFilterParams => ({
  keyword: payload.searchKeyword?.trim() || keyword,
  city: payload.emirateNames[0],
  emirates: payload.emirates,
  categoryId: payload.categoryId,
  subCategoryId: payload.subCategoryId,
  categoryName: payload.categoryName,
  subCategoryName: payload.subCategoryName,
  makeModelId: payload.makeModelId,
  trimId: payload.trimId,
  minPrice: payload.minPrice,
  maxPrice: payload.maxPrice,
  yearFrom: payload.yearFrom,
  yearTo: payload.yearTo,
  minKilometers: payload.minKilometers,
  maxKilometers: payload.maxKilometers ? String(payload.maxKilometers) : undefined,
  dynamicFilters: payload.filters,
});
