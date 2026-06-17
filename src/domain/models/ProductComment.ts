export interface CommentAuthor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isOwner?: boolean;
  isPinned?: boolean;
}

export interface ProductComment {
  id: string;
  text: string;
  createdAt: string;
  user: CommentAuthor;
  likeCount: number;
  isLiked: boolean;
  replies: ProductComment[];
  replyCount: number;
}
