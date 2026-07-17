import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  openAppSettings,
  requestMediaPermission,
  showPermissionAlert,
} from '../../utils/mediaPermissions';

const mapAsset = (asset: Asset | undefined): Asset | null => {
  if (!asset?.uri) {
    return null;
  }
  return asset;
};

const captureFromCamera = async (): Promise<Asset | null> => {
  const status = await requestMediaPermission('camera');
  if (status === 'blocked') {
    Alert.alert('Permission blocked', 'Open settings to allow camera access.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ]);
    return null;
  }
  if (status !== 'granted') {
    showPermissionAlert('camera', status);
    return null;
  }

  const result = await launchCamera({
    mediaType: 'photo',
    includeBase64: false,
    saveToPhotos: false,
    quality: 0.9,
  });

  if (result.didCancel) {
    return null;
  }

  return mapAsset(result.assets?.[0]);
};

const pickFromGallery = async (): Promise<Asset | null> => {
  const status = await requestMediaPermission('galleryImages');
  if (status === 'blocked') {
    Alert.alert('Permission blocked', 'Open settings to allow photo library access.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ]);
    return null;
  }
  if (status !== 'granted') {
    showPermissionAlert('gallery', status);
    return null;
  }

  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: false,
    quality: 0.9,
  });

  if (result.didCancel) {
    return null;
  }

  return mapAsset(result.assets?.[0]);
};

export const useDocumentImagePicker = () => {
  const pickDocumentImage = useCallback(async (): Promise<Asset | null> => {
    if (Platform.OS === 'ios') {
      return new Promise(resolve => {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Take Photo', 'Choose from Gallery', 'Cancel'],
            cancelButtonIndex: 2,
          },
          async index => {
            if (index === 0) {
              resolve(await captureFromCamera());
              return;
            }
            if (index === 1) {
              resolve(await pickFromGallery());
              return;
            }
            resolve(null);
          },
        );
      });
    }

    return new Promise(resolve => {
      Alert.alert('Upload document', 'Choose how you want to add your Emirates ID image.', [
        {
          text: 'Take Photo',
          onPress: async () => resolve(await captureFromCamera()),
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => resolve(await pickFromGallery()),
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  }, []);

  return { pickDocumentImage };
};
