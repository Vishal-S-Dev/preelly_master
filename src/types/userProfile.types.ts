export interface UserProfileAddress {
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface UserProfileLocationMeta {
  city: string | null;
  source: string | null;
  updatedAt: string | null;
}

/** Full user profile document from GET/PUT /api/user/profile */
export interface UserProfileDTO {
  _id?: string;
  id?: string;
  address?: UserProfileAddress;
  location?: UserProfileLocationMeta;
  name?: string;
  displayName?: string | null;
  gender?: string | null;
  dob?: string | Date | null;
  email?: string;
  avatar?: string | null;
  isProfileComplete?: boolean;
  rating?: number;
  isVerified?: boolean;
  verified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  emiratesIdFront?: string | null;
  emiratesIdBack?: string | null;
  identityVerificationStatus?: string;
  identityVerificationRejectionReason?: string | null;
  identityVerificationSubmittedAt?: string | null;
  identityVerifiedAt?: string | null;
  role?: string;
  adminRole?: string | null;
  savedProducts?: unknown[];
  status?: string;
  lastOauthProvider?: string | null;
  moderationWarnings?: number;
  savedLocations?: unknown[];
  memberSince?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  /** Client-side / legacy fields */
  firstName?: string;
  lastName?: string;
  nationality?: string;
  username?: string;
  bio?: string;
  ratingsCount?: number;
  ratingCount?: number;
  phone?: string;
  followers?: string[];
  following?: string[];
  stats?: {
    totalProducts?: number;
    totalViews?: number;
    totalLikes?: number;
  };
  isFollowing?: boolean;
  followStatus?: string;
  relationship?: {
    following?: boolean;
    pending?: boolean;
    status?: string;
  };
}

export interface UserFollowToggleResponseDTO {
  status?: string;
  following: boolean;
  pending: boolean;
  followerCount?: number;
  followingCount?: number;
}
