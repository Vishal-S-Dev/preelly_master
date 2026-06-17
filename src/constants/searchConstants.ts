import { SearchCity } from '../types/search.types';

export const SEARCH_CITIES: SearchCity[] = [
  'Dubai',
  'All Cities',
  'Abu Dhabi',
  'Sharjah',
  'Ras Al Khaimah',
  'Fujairah',
  'Ajman',
  'Al Ain',
  'Umm Al Quwain',
];

export const DEFAULT_SEARCH_CITY: SearchCity = 'Dubai';

export const RECENT_SEARCHES_LIMIT = 10;

export const SEARCH_SUGGESTIONS_MIN_LENGTH = 2;

export const SEARCH_SUGGESTIONS_DEBOUNCE_MS = 400;

export const POPULAR_LISTING_SECTIONS = [
  { id: 'motors', title: 'Popular in Car' },
  { id: 'property', title: 'Popular in Property' },
  { id: 'electronics', title: 'Popular in Electronics' },
  { id: 'furniture', title: 'Furniture & Garden' },
] as const;
