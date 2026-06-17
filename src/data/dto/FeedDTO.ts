export interface FeedReelSellerDto {
  _id?: string;
  name?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

export interface QuickViewFieldDto {
  fieldKey?: string;
  fieldTitle?: string;
  fieldValue?: string;
}

export interface FeedReelDto {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  caption?: string;
  price?: number;
  currency?: string;
  location?: string;
  video?: string | null;
  images?: string[];
  condition?: string;
  likesCount?: number;
  liked?: boolean;
  saved?: boolean;
  commentCount?: number;
  views?: number;
  createdAt?: string;
  status?: string;
  isSold?: boolean;
  year?: string;
  mileage?: number;
  kilometers?: number;
  regionalSpecs?: string;
  quickViewData?: QuickViewFieldDto[];
  seller?: FeedReelSellerDto | null;
}

export interface FeedDataMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface FeedDataResponseDto {
  reels: FeedReelDto[];
  reelsMeta?: FeedDataMetaDto;
  liked?: string[];
  saved?: string[];
  counts?: {
    likes?: number;
    views?: number;
  };
  unreadCount?: number;
}
