/**
 * Shared Google Maps provider for address / location map UIs.
 * Android + iOS both use Google Maps (iOS requires Google Maps pods + AppDelegate API key).
 */
import { Platform } from 'react-native';
import { getMapsNativeModule, MapsNativeModule } from './mapsNativeModule';

export type MapProvider = NonNullable<MapsNativeModule>['PROVIDER_GOOGLE'] | undefined;

export const resolveGoogleMapsProvider = (): MapProvider => {
  const mapsModule = getMapsNativeModule();
  if (!mapsModule?.PROVIDER_GOOGLE) {
    return undefined;
  }
  // Explicit google provider on both platforms for consistent address UX.
  return mapsModule.PROVIDER_GOOGLE;
};

export const isGoogleMapsConfiguredForPlatform = (): boolean => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }
  return Boolean(getMapsNativeModule()?.PROVIDER_GOOGLE);
};
