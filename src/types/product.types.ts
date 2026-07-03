import { Product } from '../domain/models/Product';

export interface ProductOverviewSpec {
  label: string;
  value: string;
}

export interface ProductAttribute {
  fieldKey: string;
  fieldTitle: string;
  fieldValue: string;
}

export interface ProductMultiAttribute {
  id: string;
  fieldKey: string;
  fieldTitle: string;
  count: number;
  fieldValues: string[];
}

export interface ProductFeatureSection {
  id: string;
  title: string;
  count: number;
  items: string[];
}

export interface ProductSellerInfo {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  postsCount: number;
  followingCount: number;
}

export interface SimilarAdItem {
  id: string;
  title: string;
  year: string;
  mileage: string;
  price: number;
  currency: string;
  imageUrl: string;
  location: string;
  postedAgo: string;
}

export interface ProductCategoryItem {
  id: string;
  title: string;
  icon: string;
}

export interface ProductDetailView {
  product: Product;
  images: string[];
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  year: string;
  mileage: string;
  specsLabel: string;
  postedOnLabel: string;
  availability: string;
  descriptionTitle: string;
  description: string;
  overviewSpecs: ProductOverviewSpec[];
  productAttributes: ProductAttribute[];
  productMultiAttributes: ProductMultiAttribute[];
  featureSections: ProductFeatureSection[];
  categoryName?: string;
  showFeatureSection: boolean;
  locationTitle: string;
  locationAddress: string;
  locationLatitude?: number;
  locationLongitude?: number;
  seller: ProductSellerInfo;
  similarAds: SimilarAdItem[];
  categories: ProductCategoryItem[];
  contactOptions?: ContactOptions;
  contactName?: string;
  contactPhone?: string;
}

export interface ContactOptions {
  inAppChat: boolean;
  call: boolean;
  whatsapp: boolean;
}
