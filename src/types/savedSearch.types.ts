/** Item shape returned by GET/POST/PUT /user/saved-searches (enrichSavedSearch output). */
export interface SavedSearchDTO {
  _id: string;
  title?: string;
  searchName?: string;
  categoryId?: string | null;
  categoryName?: string;
  categoryPath?: string[];
  subCategoryId?: string | null;
  subCategoryName?: string;
  query?: string;
  keyword?: string;
  matchCount?: number;
  newAdsCount?: number;
  previewImages?: string[];
  filters?: {
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    tags?: string[];
    extra?: Record<string, unknown>;
  };
  sortOption?: string;
  location?: string;
  searchUrl?: string;
  notifyEnabled?: boolean;
  notificationEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastViewedAt?: string;
}

export interface SavedSearchTab {
  key: string;
  label: string;
  count: number;
}

export interface SavedSearchesResponseDTO {
  savedSearches: SavedSearchDTO[];
  tabs?: SavedSearchTab[];
}

/** Payload for POST /user/saved-searches, mirroring web's buildResultsSearchSavePayload. */
export interface CreateSavedSearchPayload {
  title: string;
  searchName: string;
  categoryPath: string[];
  categoryId: string | null;
  categoryName: string;
  subcategoryId: string | null;
  subCategoryId: string | null;
  subCategoryName: string;
  query: string;
  keyword: string;
  searchType: 'keyword' | 'category' | 'filtered' | 'mixed';
  filters: {
    location: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    tags: string[];
    extra: Record<string, unknown>;
  };
  selectedFilters: Record<string, unknown>;
  sortOption: string;
  location: string;
  searchUrl: string;
  notifyEnabled: boolean;
  notificationEnabled: boolean;
  emailNotificationEnabled: boolean;
  pushNotificationEnabled: boolean;
  deviceId?: string;
  platform: 'mobile';
  isLoggedIn: boolean;
}

export interface SavedSearchListing {
  id: string;
  /** e.g. "Residential > Townhouse" */
  breadcrumb: string | null;
  /** e.g. "My Townhouse Search" (no match-count suffix — rendered separately) */
  title: string;
  matchCount: number | null;
  newAdsCount: number;
  tags: string[];
  previewImages: string[];
  savedOnLabel: string;
  notifyEnabled: boolean;
  /** Root category this item belongs to, for tab filtering (categoryPath[0] || categoryName || 'Other'). */
  rootCategoryLabel: string;
  /** Raw fields needed to rebuild SearchFilter nav params when reopening this search. */
  reopenParams: {
    keyword?: string;
    categoryId?: string;
    categoryName?: string;
    subCategoryId?: string;
    subCategoryName?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}
