import { navigateRoot, navigationRef } from '../../presentation/navigation/navigationRef';
import { PushNotificationData } from './notificationTypes';

/**
 * Mirrors NotificationsScreen.tsx's `handlePress` priority order exactly, so a push notification
 * and the equivalent in-app notification-feed item land on the same screen:
 *   1. message       -> ChatThread
 *   2. has productId -> ProductDetail   (covers like/comment/order/listing)
 *   3. follow        -> OtherProfile
 *   4. anything else (follow_request, system, unknown) -> the in-app Notifications list
 */
function navigate(data: PushNotificationData): void {
  if (data.type === 'message' && data.chatId) {
    navigateRoot('ChatThread', { threadId: data.chatId });
    return;
  }
  if (data.productId) {
    navigateRoot('ProductDetail', { productId: data.productId });
    return;
  }
  if (data.type === 'follow' && data.actorId) {
    navigateRoot('OtherProfile', { userId: data.actorId });
    return;
  }
  navigateRoot('Notifications');
}

let pendingData: PushNotificationData | null = null;

/**
 * Notification taps can arrive before the NavigationContainer is ready (cold start from a killed
 * state). If it isn't ready yet, queue the data instead of silently dropping the tap; replay it
 * once `flushPendingNotificationNavigation` runs from AppNavigator's `onReady`.
 */
export function navigateForPushData(data: PushNotificationData): void {
  if (!navigationRef.isReady()) {
    pendingData = data;
    return;
  }
  navigate(data);
}

export function flushPendingNotificationNavigation(): void {
  if (pendingData) {
    const data = pendingData;
    pendingData = null;
    navigate(data);
  }
}
