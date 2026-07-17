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
  /** Parent comment id for nested replies (flat list responses). */
  parentID?: string | { _id?: string; id?: string } | null;
  parentComment?: string | { _id?: string; id?: string } | null;
  product?: string;
  status?: string;
}
