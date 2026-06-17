import { FilterApi } from '../data/api/filterApi';
import { DynamicFilterField, EmiratesItem } from '../types/categoryFilter.types';

export const filterService = {
  getEmirates: (): Promise<EmiratesItem[]> => FilterApi.getEmirates(),
  getDynamicFilters: (subcategoryId: string): Promise<DynamicFilterField[]> =>
    FilterApi.getDynamicFilters(subcategoryId),
};
