export interface VideoDto {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  username: string;
  likesCount: number;
}

export interface VideoFeedResponseDto {
  items: VideoDto[];
  page: number;
  hasMore: boolean;
}
