import { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '../../domain/models/Product';
import { CreatePostStackParamList } from '../../types/createPost.types';
import { EditProductDetailSeed, EditProductStackParamList } from '../../types/editProduct.types';
import { ProfileTabKey } from '../../types/profile.types';
import { ChatFilter } from '../screens/chat/chatTypes';
import {
  PaymentInitiateResponse,
  PaymentFlowKind,
  PaymentResultParams,
} from '../../types/payment.types';

export type UserFeedListingSource = 'posts' | 'saved' | 'liked';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ChatThread: { threadId: string };
  ProductDetail: { productId: string; product?: Product };
  ProductImageGallery: {
    productId: string;
    title: string;
    images: string[];
    product?: Product;
    isSaved?: boolean;
  };
  ProductImageViewer: {
    images: string[];
    initialIndex?: number;
  };
  EditProduct: { productId: string; product?: Product };
  EditProductFlow: {
    productId: string;
    initialRoute?: Exclude<keyof EditProductStackParamList, 'EditProductHydrate'>;
    detailSeed?: EditProductDetailSeed;
  };
  CreatePost: NavigatorScreenParams<CreatePostStackParamList> | undefined;
  ProfileEdit: { requireCompletion?: boolean } | undefined;
  Login: undefined;
  AuthLinkEmail: undefined;
  AuthLinkPhone: undefined;
  /** @deprecated Use Login — kept for deep links / legacy navigation */
  SignIn: undefined;
  LoginWithPassword: undefined;
  VerifyOtp: undefined;
  OtherProfile: { userId: string };
  UserConnections: { userId: string; mode: 'followers' | 'following'; userName?: string };
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
  MyArchives: undefined;
  MyDrafts: undefined;
  MySearches: undefined;
  BlockedUsers: undefined;
  Support: undefined;
  FAQ: undefined;
  ContactUs: undefined;
  PrivacySecurity: undefined;
  SetNewEmail: undefined;
  SetNewMobile: undefined;
  ChangeContactOtp: {
    purpose: 'email' | 'phone';
    target: string;
    phoneCountryCode?: string;
    phoneCountryIso?: string;
  };
  CartCheckout:
    | {
        productId?: string;
        preellyApproved?: boolean;
        /** Buyer tapped Not Interested — keep Pay Through Preelly off. */
        preellyDeclined?: boolean;
        preellyConditions?: string[];
        preellyComment?: string;
      }
    | undefined;
  GetVerified: undefined;
  PaymentWebView: {
    session: PaymentInitiateResponse;
    closeCreatePost?: boolean;
    paymentFlow?: PaymentFlowKind;
    productId?: string;
  };
  PaymentSuccess: PaymentResultParams;
  PaymentFailed: PaymentResultParams;
  PaymentPending: PaymentResultParams;
  PaymentCancelled: PaymentResultParams;
  PaymentHistory: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookmark: undefined;
  Create: undefined;
  Chat: { initialFilter?: ChatFilter } | undefined;
  Profile: { initialTab?: ProfileTabKey } | undefined;
};
