import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

export type MapsNativeModule = typeof import('react-native-maps');

let cachedModule: MapsNativeModule | null | undefined;

/** True when the native maps binary is linked (requires a full native rebuild after install). */
export const isMapsNativeModuleAvailable = (): boolean => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  try {
    const turboGetter = (
      TurboModuleRegistry as unknown as {
        get?: (name: string) => unknown;
      }
    ).get;

    if (turboGetter?.('RNMapsAirModule')) {
      return true;
    }
  } catch {
    // Ignore and fall through to legacy module checks.
  }

  return Boolean(
    NativeModules.AIRMapManager ||
      NativeModules.AIRMapModule ||
      NativeModules.RNMapsAirModule,
  );
};

/** Lazy-load react-native-maps only when the native module is present. */
export const getMapsNativeModule = (): MapsNativeModule | null => {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  if (!isMapsNativeModuleAvailable()) {
    cachedModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('react-native-maps') as MapsNativeModule;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
};
