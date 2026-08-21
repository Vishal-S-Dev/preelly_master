export type ProfileTabKey = 'posts' | 'saved' | 'liked';

export interface ProfileStats {
  adsPosted: number;
  followers: number;
  following: number;
}

export interface ProfileRating {
  value: number;
  totalRatings: number;
}

export interface ProfileFollowState {
  following: boolean;
  pending: boolean;
  status?: string;
}

export interface ProfileUserView {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  bioLines: string[];
  isVerified: boolean;
  identityVerificationStatus?: string | null;
  identityVerifiedAt?: string | null;
  rating: ProfileRating;
  stats: ProfileStats;
  followState?: ProfileFollowState;
}

export interface ProfileProductGridItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export interface ProfileProductsPage {
  items: ProfileProductGridItem[];
  page: number;
  hasMore: boolean;
}

/** A row in the Followers/Following list screen. */
export interface UserConnectionListing {
  id: string;
  name: string;
  avatarUri: string | null;
  email?: string;
  rating: number;
  isVerified: boolean;
  /** Whether the viewer follows this person — undefined when viewed as a guest. */
  isFollowing?: boolean;
}
