export interface ProductUser {
  name: string;
  avatar?: string;
}

export interface Seller {
  id: string;
  name?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface QuickViewField {
  fieldKey: string;
  fieldTitle: string;
  fieldValue: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  videoUrl: string;
  imageUrl: string;
  location: string;
  likesCount: number;
  views: number;
  commentCount?: number;
  isSaved: boolean;
  createdAt: string;
  user?: ProductUser;
  liked: boolean;
  saved: boolean;
  isPaused: boolean;
  seller?: Seller;
  contactOptions?: ContactOptions;
  contactName?: string;
  contactPhone?: string;
  images?: string[];
  year?: string;
  mileage?: number;
  regionalSpecs?: string;
  quickViewData?: QuickViewField[];
}

export interface ProductsPage {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ContactOptions {
  inAppChat: boolean;
  call: boolean;
  whatsapp: boolean;
}
