import { Alert, Linking, Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
  Permission,
} from 'react-native-permissions';

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked';

const getLocationPermission = (): Permission =>
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  const permission = getLocationPermission();
  const current = await check(permission);

  if (current === RESULTS.GRANTED || current === RESULTS.LIMITED) {
    return 'granted';
  }
  if (current === RESULTS.BLOCKED || current === RESULTS.UNAVAILABLE) {
    return 'blocked';
  }

  const result = await request(permission);
  if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
    return 'granted';
  }
  if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
    return 'blocked';
  }
  return 'denied';
};

export const showLocationPermissionAlert = (status: 'denied' | 'blocked') => {
  Alert.alert(
    'Location permission required',
    status === 'blocked'
      ? 'Please enable location access in Settings to pin your listing on the map.'
      : 'Location access is needed to show your listing on the map.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openLocationSettings },
    ],
  );
};

export const openLocationSettings = async () => {
  try {
    await openSettings();
  } catch {
    Linking.openSettings();
  }
};
