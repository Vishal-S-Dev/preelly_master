export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  order?: number;
  sortOrder?: number;
  parentId?: string;
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
}
