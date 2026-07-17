export type ShareContentType = 'post' | 'reel' | 'product' | 'video';

export interface SharePayload {
  contentId: string;
  contentType: ShareContentType;
  title: string;
  thumbnail?: string;
  deepLink: string;
  productId?: string;
  sellerId?: string;
  subtitle?: string;
}

export interface ShareRecipient {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface FollowersListResponse {
  followers: unknown[];
  count: number;
}

export type SocialSharePlatform =
  | 'share'
  | 'copy'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'telegram'
  | 'x'
  | 'snapchat'
  | 'linkedin'
  | 'more';
