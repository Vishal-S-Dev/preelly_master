import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/** Root stack ref — use for screens registered on AppNavigator (e.g. PaymentWebView). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateRoot(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }
  // Root container owns PaymentWebView / payment result screens.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigationRef.navigate as any)(name, params);
  return true;
}
