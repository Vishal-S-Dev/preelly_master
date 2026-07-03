import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  Category,
  CategoriesListResponse,
  ClassifiedsCategoriesResponse,
  PropertyCategoriesResponse,
  PropertyCategory,
  PropertySubcategory,
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
    return normalizeNestedCategories(data);
  },

  async getClassifiedsCategories(): Promise<PropertyCategory[]> {
    const { data } = await httpClient.get<ClassifiedsCategoriesResponse | PropertyCategory[]>(
      API_ENDPOINTS.CLASSIFIEDS_CATEGORIES,
    );
    return normalizeNestedCategories(data);
  },
};

const normalizeNestedCategories = (
  payload: PropertyCategoriesResponse | PropertyCategory[] | ClassifiedsCategoriesResponse,
): PropertyCategory[] => {
  const list = Array.isArray(payload) ? payload : payload.data ?? payload.categories ?? [];
  return sortPropertyCategories(
    list.map(item => ({
      ...item,
      subcategories: normalizeNestedSubcategories(item.subcategories),
    })),
  );
};

const normalizeNestedSubcategories = (
  subcategories?: PropertySubcategory[] | PropertyCategory[],
): PropertySubcategory[] => {
  if (!Array.isArray(subcategories)) {
    return [];
  }

  return subcategories.map(item => ({
    _id: item._id,
    name: item.name,
    slug: item.slug,
    parentId: item.parentId,
  }));
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
