/** Populated user fragment returned from chat routes. */
export interface ChatUserRefDTO {
  _id: string;
  name?: string;
  username?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

export interface ProductRefDTO {
  _id: string;
  title?: string;
  images?: string[];
  video?: string | null;
  image?: string;
  seller?: string | { _id?: string; id?: string };
  user?: string | { _id?: string; id?: string };
}

/** One chat document as returned by GET /api/chats (lean + populated). */
export interface ChatDocumentDTO {
  _id: string;
  type?: 'product' | 'support' | 'group';
  product?: ProductRefDTO | string | null;
  buyer?: ChatUserRefDTO | string | null;
  seller?: ChatUserRefDTO | string | null;
  user?: ChatUserRefDTO | string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
  unreadForBuyer?: number;
  unreadForSeller?: number;
  unreadForUser?: number;
  unreadForAdmin?: number;
  /** Present on GET /chats/:id for the current viewer. */
  muted?: boolean;
  /** Users who muted this chat (may be present on list responses). */
  mutedBy?: Array<string | { _id?: string; toString(): string }>;
}

export interface ChatMessageDTO {
  _id: string;
  sender?: ChatUserRefDTO | string;
  text?: string;
  type?: string;
  createdAt?: string;
  read?: boolean;
  readAt?: string | null;
  attachment?: unknown;
  attachments?: unknown[];
  callMeta?: {
    callType?: 'video' | 'audio';
    status?: string;
    duration?: number;
  } | null;
  senderRole?: string | null;
}

export interface ChatWithMessagesDTO {
  chat: ChatDocumentDTO;
  messages: ChatMessageDTO[];
}

export interface UnreadCountDTO {
  unread: number;
}
