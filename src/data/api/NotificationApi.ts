import { API_ENDPOINTS } from '../../constants/appConstants';
import { ENV } from '../../constants/env';
import { NotificationApiTab } from '../../types/notification.types';
import { NotificationsResponseDTO } from '../dto/notificationDto';
import { httpClient } from './httpClient';

const API_BASE = ENV.API_BASE_URL;

export interface GetNotificationsParams {
  limit?: number;
  tab?: NotificationApiTab | 'all';
  page?: number;
}

export const NotificationApi = {
  async getNotifications(params: GetNotificationsParams = {}): Promise<NotificationsResponseDTO> {
    const limit = params.limit ?? 20;
    const page = params.page ?? 1;
    const effectiveLimit = Math.min(100, limit * page);

    const query: Record<string, string | number> = { limit: effectiveLimit };
    if (params.tab && params.tab !== 'all') {
      query.tab = params.tab;
    }

    const { data } = await httpClient.get<NotificationsResponseDTO>(API_ENDPOINTS.NOTIFICATIONS, {
      baseURL: API_BASE,
      params: query,
    });

    return data;
  },

  async markRead(notificationId: string): Promise<void> {
    await httpClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, undefined, {
      baseURL: API_BASE,
    });
  },

  async markAllRead(): Promise<void> {
    await httpClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`, undefined, {
      baseURL: API_BASE,
    });
  },

  async acceptFollowRequest(followerId: string): Promise<void> {
    await httpClient.post(`/api/user/${followerId}/follow/accept`, undefined, {
      baseURL: API_BASE,
    });
  },

  async rejectFollowRequest(followerId: string): Promise<void> {
    await httpClient.post(`/api/user/${followerId}/follow/reject`, undefined, {
      baseURL: API_BASE,
    });
  },
};
