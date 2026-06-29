import { Product } from '../../domain/models/Product';

export type UserFeedListingSource = 'posts' | 'saved' | 'liked';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  ChatThread: { threadId: string };
  ProductDetail: { productId: string; product?: Product };
  EditProduct: { productId: string; product?: Product };
  CreatePost: undefined;
  ProfileEdit: { requireCompletion?: boolean } | undefined;
  Login: undefined;
  SignIn: undefined;
  LoginWithPassword: undefined;
  VerifyOtp: undefined;
  OtherProfile: { userId: string };
  Search: { initialQuery?: string } | undefined;
  SearchFilter: {
    keyword?: string;
    city?: string;
    categoryId?: string;
    subCategoryId?: string;
    categoryName?: string;
    subCategoryName?: string;
    minPrice?: number;
    maxPrice?: number;
    year?: string;
    yearFrom?: string;
    yearTo?: string;
    maxKilometers?: string;
    minKilometers?: number;
    makeModelId?: string;
    trimId?: string;
    emirates?: string[];
    dynamicFilters?: Record<string, string | string[]>;
  } | undefined;
  CategoryFilter: {
    categoryId?: string;
    categoryName?: string;
    keyword?: string;
    selectedFilters?: Partial<import('../../types/categoryFilter.types').CategoryFilterPayload>;
  } | undefined;
  UserFeed: {
    userId: string;
    initialProductId: string;
    initialIndex: number;
    seedProducts?: Product[];
    listingSource?: UserFeedListingSource;
    ownerMode?: boolean;
  };
  Notifications: undefined;
  FollowRequests: undefined;
  MySettings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookmark: undefined;
  Create: undefined;
  Chat: undefined;
  Profile: undefined;
};
