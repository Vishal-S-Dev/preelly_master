import { Platform, Linking, Alert } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  openSettings,
  Permission,
} from 'react-native-permissions';

export type MediaPermissionKind = 'camera' | 'gallery' | 'galleryImages';

const getGalleryPermission = (kind: 'gallery' | 'galleryImages'): Permission => {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }
  if (Number(Platform.Version) >= 33) {
    return kind === 'galleryImages'
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_MEDIA_VIDEO;
  }
  return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
};

const getCameraPermission = (): Permission =>
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

export const requestMediaPermission = async (
  kind: MediaPermissionKind,
): Promise<'granted' | 'denied' | 'blocked'> => {
  const permission =
    kind === 'camera' ? getCameraPermission() : getGalleryPermission(kind);
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
  if (result === RESULTS.BLOCKED) {
    return 'blocked';
  }
  if (result === RESULTS.UNAVAILABLE) {
    return 'blocked';
  }
  return 'denied';
};

export const showPermissionAlert = (
  kind: MediaPermissionKind,
  status: 'denied' | 'blocked',
) => {
  const label = kind === 'camera' ? 'Camera' : 'Photo Library';
  Alert.alert(
    `${label} permission required`,
    status === 'blocked'
      ? `Please enable ${label.toLowerCase()} access in Settings to continue.`
      : `${label} access is needed to upload or capture listing media.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ],
  );
};

export const openAppSettings = async () => {
  try {
    await openSettings();
  } catch {
    Linking.openSettings();
  }
};
