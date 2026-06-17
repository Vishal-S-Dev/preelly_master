import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  Category,
  CategoriesListResponse,
  PropertyCategoriesResponse,
  PropertyCategory,
} from '../../types/category.types';
import { httpClient } from './httpClient';

const sortCategories = (list: Category[]): Category[] =>
  [...list].sort(
    (a, b) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0),
  );

const normalizeCategories = (payload: CategoriesListResponse | Category[]): Category[] => {
  if (Array.isArray(payload)) {
    return sortCategories(payload);
  }
  const list = payload.data ?? payload.categories ?? [];
  return sortCategories(list);
};

export const CategoryApi = {
  async getRootCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<CategoriesListResponse | Category[]>(
      API_ENDPOINTS.CATEGORIES_ROOTS,
    );
    return normalizeCategories(data);
  },

  async getSubcategories(parentId: string): Promise<Category[]> {
    const { data } = await httpClient.get<CategoriesListResponse | Category[]>(
      API_ENDPOINTS.CATEGORIES,
      { params: { parentId } },
    );
    return normalizeCategories(data);
  },

  async getPropertyCategories(): Promise<PropertyCategory[]> {
    const { data } = await httpClient.get<PropertyCategoriesResponse | PropertyCategory[]>(
      API_ENDPOINTS.PROPERTY_CATEGORIES,
    );
    const list = Array.isArray(data) ? data : data.data ?? [];
    return sortPropertyCategories(list);
  },
};

const PROPERTY_PARENT_ORDER = ['for rent', 'for sale', 'agent'];

const sortPropertyCategories = (list: PropertyCategory[]): PropertyCategory[] =>
  [...list].sort((left, right) => {
    const leftIndex = PROPERTY_PARENT_ORDER.findIndex(key =>
      left.name.toLowerCase().includes(key),
    );
    const rightIndex = PROPERTY_PARENT_ORDER.findIndex(key =>
      right.name.toLowerCase().includes(key),
    );
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
