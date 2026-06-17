export interface CommentUserDTO {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  avatar?: string | null;
}

export interface CommentDTO {
  _id?: string;
  id?: string;
  text: string;
  createdAt: string;
  user?: CommentUserDTO;
  likes?: Array<string | { _id?: string }>;
  likeCount?: number;
  isOwner?: boolean;
  isPinned?: boolean;
  replies?: CommentDTO[];
  replyCount?: number;
}
