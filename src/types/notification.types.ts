export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'message'
  | 'order'
  | 'listing'
  | 'system';

export type NotificationTab = 'all' | 'buying' | 'selling';

export type NotificationApiTab = 'buying' | 'selling' | 'general';

export interface NotificationActor {
  id: string;
  name: string;
  avatar?: string | null;
  isVerified: boolean;
}

export interface NotificationProduct {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  tab: NotificationApiTab;
  title: string;
  body: string;
  actor?: NotificationActor | null;
  relatedProduct?: NotificationProduct | null;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface NotificationsPage {
  items: NotificationItem[];
  buyingUnread: number;
  sellingUnread: number;
  hasMore: boolean;
}

export interface NotificationSection {
  title: string;
  data: NotificationItem[];
}
