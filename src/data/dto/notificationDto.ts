export interface NotificationActorDTO {
  _id?: string;
  id?: string;
  name?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

export interface NotificationProductDTO {
  _id?: string;
  id?: string;
  title?: string;
  price?: number;
  images?: string[];
  video?: string;
}

export interface NotificationItemDTO {
  _id: string;
  type: string;
  tab?: string;
  title?: string;
  body?: string;
  actor?: NotificationActorDTO | null;
  relatedProduct?: NotificationProductDTO | null;
  isRead?: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationsResponseDTO {
  items?: NotificationItemDTO[];
  notifications?: NotificationItemDTO[];
  buyingUnread?: number;
  sellingUnread?: number;
}
