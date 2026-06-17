import { useCallback } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { VIDEO_CONSTRAINTS } from '../../constants/createPostConstants';
import { useCreatePostStore } from '../../store/createPostStore';
import {
  openAppSettings,
  requestMediaPermission,
  showPermissionAlert,
} from '../../utils/mediaPermissions';
import { mapPickerAssetToVideo, validateVideoFile } from '../../utils/videoValidation';

const mapImageAssets = (assets: Asset[]) =>
  assets
    .filter(asset => asset.uri)
    .map(asset => ({
      id: `img_${Date.now()}_${Math.random()}`,
      uri: asset.uri as string,
    }));

export const useMediaPicker = () => {
  const { video, images, setVideo, addImages } = useCreatePostStore();

  const pickVideoFromGallery = useCallback(async () => {
    const status = await requestMediaPermission('gallery');
    if (status === 'blocked') {
      Alert.alert('Permission blocked', 'Open settings to allow photo library access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]);
      return;
    }
    if (status !== 'granted') {
      showPermissionAlert('gallery', status);
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
      videoQuality: 'high',
    });
    if (result.didCancel || !result.assets?.[0]) {
      return;
    }

    const mapped = mapPickerAssetToVideo(result.assets[0]);
    if (!mapped) {
      return;
    }
    const validation = validateVideoFile(mapped);
    if (!validation.valid) {
      Alert.alert('Invalid video', validation.error);
      return;
    }
    setVideo(mapped);
  }, [setVideo]);

  const captureVideo = useCallback(async () => {
    const status = await requestMediaPermission('camera');
    if (status === 'blocked') {
      Alert.alert('Permission blocked', 'Open settings to allow camera access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]);
      return;
    }
    if (status !== 'granted') {
      showPermissionAlert('camera', status);
      return;
    }

    const result = await launchCamera({
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: VIDEO_CONSTRAINTS.maxDurationSec,
    });
    if (result.didCancel || !result.assets?.[0]) {
      return;
    }

    const mapped = mapPickerAssetToVideo(result.assets[0]);
    if (!mapped) {
      return;
    }
    const validation = validateVideoFile(mapped);
    if (!validation.valid) {
      Alert.alert('Invalid video', validation.error);
      return;
    }
    setVideo(mapped);
  }, [setVideo]);

  const pickImages = useCallback(async () => {
    const status = await requestMediaPermission('gallery');
    if (status === 'blocked') {
      Alert.alert('Permission blocked', 'Open settings to allow photo library access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]);
      return;
    }
    if (status !== 'granted') {
      showPermissionAlert('gallery', status);
      return;
    }
    const remaining = VIDEO_CONSTRAINTS.maxImages - images.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', 'You can upload up to 10 images.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
    });
    if (result.didCancel || !result.assets?.length) {
      return;
    }
    addImages(mapImageAssets(result.assets));
  }, [addImages, images.length]);

  return {
    video,
    pickVideoFromGallery,
    captureVideo,
    pickImages,
  };
};
