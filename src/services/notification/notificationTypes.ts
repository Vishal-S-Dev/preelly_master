import { NotificationType } from '../../types/notification.types';

/**
 * Structured `data` payload every push notification must carry. Mirrors the in-app notification
 * feed's existing `NotificationType` taxonomy (types/notification.types.ts) instead of inventing
 * a parallel one, and carries exactly the identifiers NotificationsScreen's own tap handler
 * already relies on (chatId / productId / actorId) so navigation logic can be shared.
 *
 * Navigation MUST be driven by these fields, never by notification.title/body text.
 */
export interface PushNotificationData {
  type: NotificationType;
  notificationId?: string;
  chatId?: string;
  productId?: string;
  actorId?: string;
}

export interface PushNotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Partial<Record<keyof PushNotificationData, string>>;
}

const VALID_NOTIFICATION_TYPES: ReadonlySet<string> = new Set<NotificationType>([
  'like',
  'comment',
  'follow',
  'follow_request',
  'message',
  'order',
  'listing',
  'system',
]);

/** Validates and narrows an untyped FCM `data` object — never trust the wire payload blindly. */
export function parsePushNotificationData(
  raw: Record<string, string | undefined> | undefined,
): PushNotificationData | null {
  if (!raw) {
    return null;
  }
  const type = raw.type;
  if (!type || !VALID_NOTIFICATION_TYPES.has(type)) {
    return null;
  }
  return {
    type: type as NotificationType,
    notificationId: raw.notificationId || undefined,
    chatId: raw.chatId || undefined,
    productId: raw.productId || undefined,
    actorId: raw.actorId || undefined,
  };
}
