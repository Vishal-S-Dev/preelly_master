export interface ArchivedListingCategoryDTO {
  _id?: string;
  name?: string;
}

/** Item shape returned by GET /api/user/listings (select() projection on Product). */
export interface ArchivedListingDTO {
  _id: string;
  title?: string;
  price?: number;
  currency?: string;
  status?: string;
  moderationStatus?: string;
  images?: string[];
  video?: string;
  location?: string;
  category?: ArchivedListingCategoryDTO;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
}

export interface ArchivedListingsResponseDTO {
  items: ArchivedListingDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ArchiveSortKey =
  | 'archived_newest'
  | 'archived_oldest'
  | 'updated'
  | 'price_asc'
  | 'price_desc';

export interface ArchivedListing {
  id: string;
  title: string;
  priceLabel: string;
  categoryName: string;
  location: string | null;
  imageUrl: string | null;
  archivedAt: string | null;
  updatedAt: string | null;
}
