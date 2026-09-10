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
  /** Absolute preview video URL, present only when `hasVideo` is true. */
  videoUrl?: string;
  isSaved?: boolean;
  /** True only while this listing occupies a paid, currently-valid, budget-available
   * promoted slot — server-computed per search request (mirrors web's "Promoted" badge). */
  isPromoted?: boolean;
  isSold?: boolean;
  status?: string;
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
