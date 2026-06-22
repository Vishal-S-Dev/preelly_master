export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl: string;
  avatar: string;
  isVerified: boolean;
}

export type ChatThreadKind = 'product' | 'support';

/** Normalized inbox thread (mirrors olx `transformChat` shape, adapted for the app domain). */
export interface ChatThread {
  id: string;
  kind: ChatThreadKind;
  updatedAt: string;
  productId: string | null;
  productTitle: string;
  productImageUrl: string;
  product: Product;
  images: string[];
  buyer: ChatParticipant;
  seller: ChatParticipant;
  /** Support chat: the customer (same as viewer when using the consumer app). */
  supportCustomer: ChatParticipant | null;
  lastMessage: string;
  unreadForViewer: number;
  /** Product chat: viewer is buyer or seller. Support: treated as `support` for clarity. */
  viewerRole: 'buyer' | 'seller' | 'support';
}

export interface ChatCallMeta {
  callType: 'video' | 'audio';
  status: 'completed' | 'missed' | 'rejected' | 'cancelled';
  duration?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string | null;
  senderRole: 'buyer' | 'seller' | null;
  type: string;
  text: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
  callMeta?: ChatCallMeta | null;
}
export interface Product {
  id: string;
  images : string[];
}
