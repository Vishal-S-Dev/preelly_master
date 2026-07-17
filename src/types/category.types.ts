export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  categoryImage?: string | null;
  emoji?: string | null;
  colorCode?: string | null;
  xOrder?: number;
  order?: number;
  sortOrder?: number;
  parentId?: string | null;
  level?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  count?: number;
}

export interface CategoriesListResponse {
  success?: boolean;
  message?: string;
  data?: Category[];
  categories?: Category[];
}

export interface PropertySubcategory {
  _id: string;
  name: string;
  slug?: string;
  parentId?: string;
}

export interface PropertyCategory {
  _id: string;
  name: string;
  slug?: string;
  parentId?: string;
  subcategories: PropertySubcategory[];
}

export interface PropertyCategoriesResponse {
  success?: boolean;
  message?: string;
  data?: PropertyCategory[];
  categories?: PropertyCategory[];
}

export type ClassifiedsCategoriesResponse = PropertyCategoriesResponse;
