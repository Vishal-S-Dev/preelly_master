import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  assetToPendingAttachment,
  MAX_CHAT_ATTACHMENTS,
  PendingChatAttachment,
  validatePendingAttachment,
} from '../../utils/chatAttachmentUtils';
import {
  openAppSettings,
  requestMediaPermission,
  showPermissionAlert,
} from '../../utils/mediaPermissions';

const mapAssets = (assets: Asset[] | undefined): PendingChatAttachment[] =>
  (assets ?? [])
    .map((asset, index) => assetToPendingAttachment(asset, index))
    .filter(Boolean) as PendingChatAttachment[];

export const useChatImagePicker = () => {
  const pickFromCamera = useCallback(async (): Promise<PendingChatAttachment[]> => {
    const status = await requestMediaPermission('camera');
    if (status === 'blocked') {
      Alert.alert('Permission blocked', 'Open settings to allow camera access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]);
      return [];
    }
    if (status !== 'granted') {
      showPermissionAlert('camera', status);
      return [];
    }

    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: false,
      saveToPhotos: false,
      quality: 0.85,
    });

    if (result.didCancel || !result.assets?.length) {
      return [];
    }

    const mapped = mapAssets(result.assets);
    const invalid = mapped.find(item => validatePendingAttachment(item));
    if (invalid) {
      const message = validatePendingAttachment(invalid);
      if (message) {
        Alert.alert('Invalid image', message);
      }
      return [];
    }
    return mapped;
  }, []);

  const pickFromGallery = useCallback(
    async (currentCount = 0): Promise<PendingChatAttachment[]> => {
      const status = await requestMediaPermission('galleryImages');
      if (status === 'blocked') {
        Alert.alert('Permission blocked', 'Open settings to allow photo library access.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppSettings },
        ]);
        return [];
      }
      if (status !== 'granted') {
        showPermissionAlert('gallery', status);
        return [];
      }

      const remaining = MAX_CHAT_ATTACHMENTS - currentCount;
      if (remaining <= 0) {
        Alert.alert('Limit reached', `You can attach up to ${MAX_CHAT_ATTACHMENTS} images.`);
        return [];
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: remaining,
        includeBase64: false,
        quality: 0.85,
      });

      if (result.didCancel || !result.assets?.length) {
        return [];
      }

      const mapped = mapAssets(result.assets).slice(0, remaining);
      for (const item of mapped) {
        const message = validatePendingAttachment(item);
        if (message) {
          Alert.alert('Invalid image', message);
          return [];
        }
      }
      return mapped;
    },
    [],
  );

  return { pickFromCamera, pickFromGallery };
};
