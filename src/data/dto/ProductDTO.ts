export interface ProductUserDTO {
  name?: string;
  avatar?: string | null;
}

export interface ProductSellerDTO {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
  rating?: number;
  isVerified?: boolean;
  memberSince?: string;
  identityVerificationStatus?: string;
}

export interface ProductCategoryRefDTO {
  _id?: string;
  name?: string;
  icon?: string | null;
  emoji?: string;
  slug?: string;
}

export interface ProductCarOverviewDTO {
  engineCapacity?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  doors?: string;
  horsepower?: string;
  kilometers?: number | string;
  trim?: string;
  seatingCapacity?: string;
  interiorColor?: string;
  warranty?: string;
  cylinders?: string;
  condition?: string;
  city?: string;
  regionalSpecs?: string;
  year?: number | string;
  exteriorColor?: string;
  steeringSide?: string;
  isInsured?: string;
  model?: string;
}

export interface ProductVehicleFeatureDTO {
  title: string;
  items: string[];
}

export interface ProductAttributeDto {
  fieldKey?: string;
  fieldTitle?: string;
  fieldValue?: string;
}

export interface ProductMultiAttributeDto {
  fieldKey?: string;
  fieldTitle?: string;
  fieldValues?: string[];
}

export interface ProductContactOptionsDTO {
  inAppChat?: boolean;
  call?: boolean;
  whatsapp?: boolean;
}

export interface ProductAiExtractedDetailsDTO {
  title?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | string | null;
  price?: number | null;
  currency?: string | null;
  condition?: string | null;
  raw?: Record<string, string | number | boolean | null>;
}

export interface ProductDTO {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  video?: string;
  videoScreenshots?: Array<{ image?: string; timestamp?: number }>;
  images?: string[];
  location?: string;
  likes?: Array<string | { _id?: string }>;
  liked?: boolean;
  isLiked?: boolean;
  saved?: boolean;
  isSaved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: ProductUserDTO;
  seller?: ProductSellerDTO;
  views?: number;
  year?: number | string;
  kilometers?: string | number;
  kilometersValue?: number | string;
  brand?: string;
  model?: string;
  trim?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  doors?: string;
  interiorColor?: string;
  color?: string;
  warranty?: string;
  condition?: string;
  country?: string;
  city?: string;
  area?: string;
  isSold?: boolean;
  status?: string;
  category?: ProductCategoryRefDTO;
  subcategory?: string;
  categoryPath?: ProductCategoryRefDTO[];
  contactOptions?: ProductContactOptionsDTO;
  contactName?: string;
  contactPhone?: string;
  phoneNumber?: string | null;
  locateYourItem?: string;
  buildingStreetName?: string;
  regionalSpecsIdValue?: string;
  carOverview?: ProductCarOverviewDTO;
  vehicleFeatures?: ProductVehicleFeatureDTO[];
  productAttributes?: ProductAttributeDto[];
  productMultiAttributes?: ProductMultiAttributeDto[];
  productPriceValue?: number;
  aiExtractedDetails?: ProductAiExtractedDetailsDTO;
  additionalFields?: Record<string, unknown>;
  latitude?: number;
  longitude?: number;
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface ProductsResponseDTO {
  products: ProductDTO[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
