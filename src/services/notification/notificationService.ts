import { Platform } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  getAPNSToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  Messaging,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { NotificationApi } from '../../data/api/NotificationApi';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { storage } from '../../utils/storage';
import { DEFAULT_ANDROID_CHANNEL_ID, ensureDefaultAndroidChannel } from './notificationChannel';
import { flushPendingNotificationNavigation, navigateForPushData } from './notificationNavigation';
import { parsePushNotificationData, PushNotificationData } from './notificationTypes';

const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[notificationService]', ...args);
  }
};

/**
 * `getMessaging()` throws synchronously ("No Firebase App '[DEFAULT]' has been created") until
 * `google-services.json`/`GoogleService-Info.plist` are added and the native SDK auto-configures
 * the default app. This MUST be lazy, never called at module top level — the whole app would fail
 * to boot (AppRegistry.registerComponent never runs) if this threw during import, which is far
 * worse than push notifications simply being unavailable.
 */
let messagingInstance: Messaging | null = null;
let messagingUnavailable = false;

function getMessagingSafe(): Messaging | null {
  if (messagingInstance) {
    return messagingInstance;
  }
  if (messagingUnavailable) {
    return null;
  }
  try {
    messagingInstance = getMessaging();
    return messagingInstance;
  } catch (error) {
    messagingUnavailable = true;
    devLog('Firebase is not configured yet — push notifications disabled', error);
    return null;
  }
}

/** Never let a notification-plumbing failure take down the rest of the app. */
const safe = async (label: string, fn: () => Promise<void> | void): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    devLog(`${label} failed`, error);
  }
};

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * `registerDeviceForRemoteMessages()` only kicks off iOS's native APNs registration — it
 * resolves once `UIApplication.registerForRemoteNotifications()` is called, not once APNs has
 * actually delivered a device token back via the app delegate callback. Calling `getToken()`
 * before that lands throws `messaging/unknown: No APNS token specified before fetching FCM
 * Token`. Poll briefly instead of assuming it's ready. Bounded (not infinite) since real APNs
 * delivery to the iOS Simulator is version-dependent and can simply never arrive.
 */
const waitForApnsToken = async (
  messaging: Messaging,
  { attempts = 10, intervalMs = 500 }: { attempts?: number; intervalMs?: number } = {},
): Promise<string | null> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const apnsToken = await getAPNSToken(messaging);
    if (apnsToken) {
      return apnsToken;
    }
    await wait(intervalMs);
  }
  return null;
};

const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await storage.getString(STORAGE_KEYS.DEVICE_ID);
  if (existing) {
    return existing;
  }
  const generated = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await storage.setString(STORAGE_KEYS.DEVICE_ID, generated);
  return generated;
};

const remoteMessageToData = (message: RemoteMessage): PushNotificationData | null =>
  parsePushNotificationData(message.data as Record<string, string | undefined> | undefined);

/** Foreground-only — background/killed states already get a system tray notification natively
 * from the `notification` block, so displaying here too would duplicate it. */
const displayForegroundNotification = async (message: RemoteMessage): Promise<void> => {
  const title = message.notification?.title;
  const body = message.notification?.body;
  if (!title && !body) {
    return;
  }
  await ensureDefaultAndroidChannel();
  await notifee.displayNotification({
    title,
    body,
    data: message.data as Record<string, string> | undefined,
    android: {
      channelId: DEFAULT_ANDROID_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
    ios: {
      foregroundPresentationOptions: { alert: true, sound: true, badge: true },
    },
  });
};

let listenersInitialized = false;
let unsubscribers: Array<() => void> = [];

/**
 * Sets up tap/foreground/refresh listeners exactly once for the app's lifetime — call from
 * App.tsx's Bootstrap effect, unconditionally (not gated on auth), since a notification tap can
 * be the very thing that launches the app from a killed state. Safe to call more than once.
 */
export function initializeNotificationListeners(): void {
  if (listenersInitialized) {
    return;
  }
  listenersInitialized = true;

  // Notifee's own events (foreground tap, killed-app initial notification for
  // notifee-displayed notifications) don't depend on Firebase — always safe to register.
  unsubscribers.push(
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = parsePushNotificationData(
          detail.notification?.data as Record<string, string | undefined> | undefined,
        );
        if (data) {
          navigateForPushData(data);
        }
      }
    }),
  );
  void notifee.getInitialNotification().then(initial => {
    if (initial) {
      const data = parsePushNotificationData(
        initial.notification.data as Record<string, string | undefined> | undefined,
      );
      if (data) {
        navigateForPushData(data);
      }
    }
  });

  const messaging = getMessagingSafe();
  if (!messaging) {
    return;
  }

  unsubscribers.push(
    onMessage(messaging, message => {
      void safe('onMessage', () => displayForegroundNotification(message));
    }),
  );

  unsubscribers.push(
    onNotificationOpenedApp(messaging, message => {
      const data = remoteMessageToData(message);
      if (data) {
        navigateForPushData(data);
      }
    }),
  );

  // Killed-app tap: whichever fires first (FCM's own record or Notifee's foreground-displayed
  // copy) wins; the other resolves to null since consuming one clears it.
  void getInitialNotification(messaging).then(message => {
    if (message) {
      const data = remoteMessageToData(message);
      if (data) {
        navigateForPushData(data);
      }
    }
  });
}

export { flushPendingNotificationNavigation };

/**
 * Best-effort FCM token fetch for attaching to auth requests (e.g. verify-otp) that want the
 * device token inline. Deliberately does NOT request notification permission — that prompt stays
 * tied to `registerForPushNotifications()` below, which still runs post-login as before. Never
 * throws; callers get `null` if Firebase isn't configured, permission was never granted, or the
 * iOS APNs token hasn't arrived yet (kept short so it never noticeably delays login).
 */
export async function getDeviceTokenSilently(): Promise<string | null> {
  const messaging = getMessagingSafe();
  if (!messaging) {
    return null;
  }
  try {
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
      const apnsToken = await waitForApnsToken(messaging, { attempts: 4, intervalMs: 300 });
      if (!apnsToken) {
        return null;
      }
    }
    return await getToken(messaging);
  } catch (error) {
    devLog('getDeviceTokenSilently failed', error);
    return null;
  }
}

const registerTokenWithBackend = async (token: string): Promise<void> => {
  const deviceId = await getOrCreateDeviceId();
  await NotificationApi.registerDeviceToken({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    deviceId,
  });
  await storage.setString(STORAGE_KEYS.DEVICE_PUSH_TOKEN, token);
};

let tokenRefreshUnsubscribe: (() => void) | null = null;

/**
 * Full permission → token → backend-registration flow. Call once per login (mirrors
 * ensureSocketReadyForUser's call site inside the auth thunks / App.tsx cold start). Every step
 * is wrapped so a denied permission or unreachable backend never blocks login.
 */
export async function registerForPushNotifications(): Promise<void> {
  const messaging = getMessagingSafe();
  if (!messaging) {
    return;
  }

  await safe('requestPermission', async () => {
    const settings = await notifee.requestPermission();
    devLog('permission status', settings.authorizationStatus);
  });

  await safe('ensureChannel', () => ensureDefaultAndroidChannel());

  await safe('registerDeviceForRemoteMessages', async () => {
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
      const apnsToken = await waitForApnsToken(messaging);
      if (!apnsToken) {
        devLog(
          'No APNs token after waiting — common on iOS Simulator (delivery is version-dependent ' +
            'and can simply never arrive there); getToken() will be skipped this run. Test on a ' +
            'real device for a reliable APNs token.',
        );
      }
    }
  });

  await safe('getToken+register', async () => {
    if (Platform.OS === 'ios' && !(await getAPNSToken(messaging))) {
      // Still no APNs token (see above) — getToken() would just throw
      // "messaging/unknown: No APNS token specified", so skip it for this run rather than log
      // a misleading failure. onTokenRefresh below will still pick it up if APNs delivers later.
      return;
    }
    const token = await getToken(messaging);
    if (token) {
      // Full token intentionally logged only in dev builds — it's a device identifier and must
      // never be exposed in production logs.
      devLog('FCM token', token);
      await registerTokenWithBackend(token);
    }
  });

  if (!tokenRefreshUnsubscribe) {
    tokenRefreshUnsubscribe = onTokenRefresh(messaging, nextToken => {
      void safe('onTokenRefresh', () => registerTokenWithBackend(nextToken));
    });
  }
}

/**
 * Called on logout — tells the backend this device's token no longer belongs to the signed-out
 * user (important on shared/family devices). Does not touch the FCM token itself; it still
 * belongs to this app install and will be re-registered under whichever user logs in next.
 */
export async function unregisterPushNotifications(): Promise<void> {
  await safe('unregisterDeviceToken', async () => {
    const token = await storage.getString(STORAGE_KEYS.DEVICE_PUSH_TOKEN);
    if (token) {
      await NotificationApi.unregisterDeviceToken(token);
    }
  });
}

/** Test-only / hot-reload escape hatch — not called in production code paths. */
export function teardownNotificationListeners(): void {
  unsubscribers.forEach(unsubscribe => unsubscribe());
  unsubscribers = [];
  tokenRefreshUnsubscribe?.();
  tokenRefreshUnsubscribe = null;
  listenersInitialized = false;
}
