import { AdPackage } from './package.types';
import { CheckoutListingSnapshot } from './checkout.types';

export interface CreatePostCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CreatePostSubcategory {
  id: string;
  name: string;
}

export interface CreatePostMediaFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
}

export interface CreatePostImageAsset {
  id: string;
  uri: string;
  fromVideo?: boolean;
  caption?: string;
  order?: number;
}

export interface CreatePostDynamicField {
  key: string;
  label: string;
  required?: boolean;
  options: string[];
}

export interface TranscriptExtractedData {
  title?: string;
  description?: string;
  price?: number | string;
  country?: string;
  city?: string;
  area?: string;
  make?: string;
  model?: string;
  year?: string | number;
  mileage?: string | number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  trim?: string;
  regionalSpecs?: string;
  [key: string]: unknown;
}

export interface SuggestedFilters {
  selections?: Record<string, string>;
  filterData?: Record<string, unknown>;
}

export interface AiListingExtraction {
  display_data?: Record<string, unknown>;
  filter_data?: Record<string, unknown>;
  missing_fields?: string[];
  confidence?: Record<string, number>;
}

export interface TranscribeVideoResponse {
  transcript?: string;
  extractedData?: TranscriptExtractedData;
  suggestedFilters?: SuggestedFilters;
  categoryValidation?: Record<string, unknown>;
  errors?: {
    transcription?: string;
    extraction?: string;
  };
}

export interface CreatePostDraft {
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  video?: CreatePostMediaFile | null;
  images: CreatePostImageAsset[];
  title: string;
  description: string;
  transcript: string;
  extractedData?: TranscriptExtractedData | null;
  suggestedFilters?: SuggestedFilters | null;
  aiExtraction?: AiListingExtraction | null;
  dynamicFields: Record<string, string>;
  price: string;
  phone: string;
  exteriorColor: string;
  interiorColor: string;
  warranty: string;
  fuelType: string;
  insuredInUae: string;
  dynamicFormCategoryId?: string;
  locateYourItem: string;
  locationAddress: string;
  locationLatitude: number;
  locationLongitude: number;
}

export type CreatePostStackParamList = {
  CreatePostCategory: undefined;
  CreatePostSubcategory: undefined;
  CreatePostMediaStep: undefined;
  CreatePostProcessing: undefined;
  CreatePostDetailsStep: undefined;
  CreatePostFormStep: undefined;
  CreatePostAdvancedFormStep: undefined;
  CreatePostSummaryStep: undefined;
  CreatePostPreviewStep: undefined;
  CreatePostPlaceAnAd: {
    productId?: string;
    listing?: CheckoutListingSnapshot;
  };
  CreatePostBuyPackage: {
    productId?: string;
    listing: CheckoutListingSnapshot;
    adPackage: AdPackage;
  };
};
