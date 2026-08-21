/**
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppRegistry, StyleSheet } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Must be registered here, outside any React component, before AppRegistry.registerComponent —
// this is what lets FCM wake the app for background/killed-state messages.
// `getMessaging()` throws until google-services.json/GoogleService-Info.plist are added and the
// native SDK auto-configures the default Firebase app — guard it so a missing config can never
// take down AppRegistry.registerComponent below (which would crash the entire app, not just push).
try {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[background handler] message received', remoteMessage.messageId);
    }
    // Messages carrying a `notification` block are already displayed by the OS notification tray
    // natively in this state — do not also call notifee.displayNotification here, or the user
    // will see the same message twice. This handler exists for data-only messages / silent
    // processing.
  });
} catch (error) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[background handler] Firebase not configured yet — skipping.', error);
  }
}

// Required by Notifee so background notification presses/actions don't warn as unhandled; actual
// tap-driven navigation happens once the app resumes, via onNotificationOpenedApp/getInitialNotification.
notifee.onBackgroundEvent(async () => undefined);

const Root = () => (
  <GestureHandlerRootView style={styles.root}>
    <App />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

AppRegistry.registerComponent(appName, () => Root);
