export interface VideoModel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  username: string;
  likesCount: number;
  isLiked: boolean;
}

export interface VideoFeedPage {
  items: VideoModel[];
  page: number;
  hasMore: boolean;
}
