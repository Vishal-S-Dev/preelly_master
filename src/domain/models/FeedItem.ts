export interface FeedUser {
  name: string;
  avatar: string;
}

export interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  mediaUrl: string;
  thumbnail: string;
  mediaType: 'video' | 'image';
  likes: number;
  comments: number;
  shares: number;
  isAvailable: boolean;
  user: FeedUser;
  liked: boolean;
  isPaused: boolean;
}

export interface FeedPage {
  items: FeedItem[];
  page: number;
  hasMore: boolean;
}
