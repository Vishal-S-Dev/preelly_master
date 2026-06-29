import {
  NotificationTab,
  NotificationsPage,
} from '../../types/notification.types';

export interface NotificationRepository {
  getPage(params: { tab: NotificationTab; page: number; limit: number }): Promise<NotificationsPage>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(): Promise<void>;
  acceptFollowRequest(followerId: string): Promise<void>;
  rejectFollowRequest(followerId: string): Promise<void>;
}
