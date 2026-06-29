import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  NotificationActor,
  NotificationItem,
  NotificationProduct,
  NotificationTab,
  NotificationType,
  NotificationsPage,
} from '../../types/notification.types';
import { NotificationApi } from '../api/NotificationApi';
import { NotificationActorDTO, NotificationItemDTO, NotificationProductDTO } from '../dto/notificationDto';
import { NotificationRepository } from '../../domain/repository/NotificationRepository';

const NOTIFICATION_TYPES: NotificationType[] = [
  'like',
  'comment',
  'follow',
  'follow_request',
  'message',
  'order',
  'listing',
  'system',
];

const mapActor = (dto?: NotificationActorDTO | null): NotificationActor | null => {
  if (!dto) {
    return null;
  }
  const id = String(dto._id ?? dto.id ?? '');
  if (!id) {
    return null;
  }
  return {
    id,
    name: dto.name?.trim() || 'User',
    avatar: dto.avatar ?? null,
    isVerified: Boolean(dto.isVerified),
  };
};

const mapProduct = (dto?: NotificationProductDTO | null): NotificationProduct | null => {
  if (!dto) {
    return null;
  }
  const id = String(dto._id ?? dto.id ?? '');
  if (!id) {
    return null;
  }
  const imageRaw = dto.images?.[0];
  return {
    id,
    title: dto.title?.trim() || 'Listing',
    price: dto.price,
    imageUrl: imageRaw ? resolveMediaUrl(imageRaw) : null,
    videoUrl: dto.video ? resolveMediaUrl(dto.video) : null,
  };
};

const mapNotification = (dto: NotificationItemDTO): NotificationItem => {
  const type = NOTIFICATION_TYPES.includes(dto.type as NotificationType)
    ? (dto.type as NotificationType)
    : 'system';

  return {
    id: dto._id,
    type,
    tab:
      dto.tab === 'buying' || dto.tab === 'selling' || dto.tab === 'general'
        ? dto.tab
        : 'general',
    title: dto.title?.trim() || '',
    body: dto.body?.trim() || '',
    actor: mapActor(dto.actor),
    relatedProduct: mapProduct(dto.relatedProduct),
    isRead: Boolean(dto.isRead),
    createdAt: dto.createdAt,
    data: dto.data ?? {},
  };
};

const tabToApi = (tab: NotificationTab): 'buying' | 'selling' | 'all' => {
  if (tab === 'buying') {
    return 'buying';
  }
  if (tab === 'selling') {
    return 'selling';
  }
  return 'all';
};

export class NotificationRepositoryImpl implements NotificationRepository {
  async getPage(params: {
    tab: NotificationTab;
    page: number;
    limit: number;
  }): Promise<NotificationsPage> {
    const response = await NotificationApi.getNotifications({
      tab: tabToApi(params.tab),
      page: params.page,
      limit: params.limit,
    });

    const rawItems = response.items ?? response.notifications ?? [];
    const mapped = rawItems.map(mapNotification);
    const start = (params.page - 1) * params.limit;
    const pageItems = mapped.slice(start, start + params.limit);

    return {
      items: pageItems,
      buyingUnread: response.buyingUnread ?? 0,
      sellingUnread: response.sellingUnread ?? 0,
      hasMore: mapped.length >= params.limit * params.page,
    };
  }

  async markRead(notificationId: string): Promise<void> {
    await NotificationApi.markRead(notificationId);
  }

  async markAllRead(): Promise<void> {
    await NotificationApi.markAllRead();
  }

  async acceptFollowRequest(followerId: string): Promise<void> {
    await NotificationApi.acceptFollowRequest(followerId);
  }

  async rejectFollowRequest(followerId: string): Promise<void> {
    await NotificationApi.rejectFollowRequest(followerId);
  }
}

export const notificationRepository = new NotificationRepositoryImpl();
