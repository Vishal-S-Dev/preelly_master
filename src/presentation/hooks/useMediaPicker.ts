import { useCallback, useState } from 'react';
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
  const { video, images, setVideo, addImages, replaceImage } = useCreatePostStore();
  // Covers the whole pick→validate span, including the OS picker's own iCloud/on-demand-
  // resource download for large gallery videos — that wait happens inside the
  // launchImageLibrary/launchCamera promise, not after it, so the screen needs its own loading
  // state rather than relying on the (instant) synchronous validation step alone.
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

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

    setIsProcessingVideo(true);
    try {
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
    } finally {
      setIsProcessingVideo(false);
    }
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

    setIsProcessingVideo(true);
    try {
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
    } finally {
      setIsProcessingVideo(false);
    }
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

  const pickImageToReplace = useCallback(
    async (replaceId: string) => {
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
        mediaType: 'photo',
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets?.[0]?.uri) {
        return;
      }

      const [asset] = mapImageAssets(result.assets);
      replaceImage(replaceId, { uri: asset.uri, fromVideo: false });
    },
    [replaceImage],
  );

  return {
    video,
    isProcessingVideo,
    pickVideoFromGallery,
    captureVideo,
    pickImages,
    pickImageToReplace,
  };
};
