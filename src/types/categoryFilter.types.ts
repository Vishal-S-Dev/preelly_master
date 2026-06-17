export interface EmiratesItem {
  _id: string;
  name: string;
}

export type DynamicFilterFieldType =
  | 'multi_select'
  | 'single_select'
  | 'dropdown'
  | 'color'
  | 'range'
  | 'boolean'
  | 'text';

export interface DynamicFilterOption {
  value: string;
  label: string;
  color?: string;
}

export interface DynamicFilterField {
  id: string;
  fieldKey: string;
  fieldTitle: string;
  fieldType: DynamicFilterFieldType;
  options?: DynamicFilterOption[];
  min?: number;
  max?: number;
}

export interface CategoryFilterPayload {
  emirates: string[];
  emirateNames: string[];
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  makeModelId?: string;
  makeModelName?: string;
  trimId?: string;
  trimName?: string;
  minPrice?: number;
  maxPrice?: number;
  yearFrom?: string;
  yearTo?: string;
  minKilometers?: number;
  maxKilometers?: number;
  searchKeyword?: string;
  filters: Record<string, string | string[]>;
}

export const EMPTY_CATEGORY_FILTER: CategoryFilterPayload = {
  emirates: [],
  emirateNames: [],
  categoryId: '',
  categoryName: '',
  subCategoryId: '',
  subCategoryName: '',
  filters: {},
};

export const DEFAULT_PRICE_MIN = 50000;
export const DEFAULT_PRICE_MAX = 2500000;
