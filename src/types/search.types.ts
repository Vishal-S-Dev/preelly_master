export interface PopularSearchItem {
  keyword: string;
  searchCount: number;
  lastSearchedAt?: string;
}

export interface PopularSearchesData {
  keywords: string[];
  items: PopularSearchItem[];
  total: number;
}

export interface SearchListingItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  imageUrl: string;
  hasVideo: boolean;
  isSaved?: boolean;
  isFeatured?: boolean;
}

export type SearchCity =
  | 'Dubai'
  | 'All Cities'
  | 'Abu Dhabi'
  | 'Sharjah'
  | 'Ras Al Khaimah'
  | 'Fujairah'
  | 'Ajman'
  | 'Al Ain'
  | 'Umm Al Quwain';
