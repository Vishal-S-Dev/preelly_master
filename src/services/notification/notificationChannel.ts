import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

/**
 * Single default channel for now. `notifee.createChannel` upserts by ID — safe to call on every
 * app start, it will never create duplicates. Add more channel IDs here (e.g. 'chat_messages',
 * 'orders') as distinct notification types need their own user-configurable sound/importance.
 */
export const DEFAULT_ANDROID_CHANNEL_ID = 'default_notifications';

let channelReady: Promise<void> | null = null;

/** Idempotent — safe to call multiple times; the underlying create call itself upserts too. */
export function ensureDefaultAndroidChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = notifee
      .createChannel({
        id: DEFAULT_ANDROID_CHANNEL_ID,
        name: 'General Notifications',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PRIVATE,
        sound: 'default',
        vibration: true,
        badge: true,
      })
      .then(() => undefined);
  }
  return channelReady;
}
