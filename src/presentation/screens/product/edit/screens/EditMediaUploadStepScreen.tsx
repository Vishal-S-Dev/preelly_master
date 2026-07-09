import React, { useCallback } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { CreatePostFooter, CreatePostHeader } from '../../../../components/createPost/StepIndicator';
import { MediaPickerCard } from '../../../../components/createPost/MediaPickerCard';
import { VideoPreview } from '../../../../components/createPost/VideoPreview';
import { useCreatePostStyles } from '../../../../hooks/useCreatePostStyles';
import { useEditMediaPicker } from '../hooks/useEditMediaPicker';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductMediaStep'>;

export const EditMediaUploadStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryName, setVideo, setRemoteVideoUrl, images } = useEditProductStore();
  const { playbackVideo, pickVideoFromGallery, captureVideo } = useEditMediaPicker();

  const hasExistingMedia = Boolean(playbackVideo) || images.length > 0;

  const clearVideo = useCallback(() => {
    setVideo(null);
    setRemoteVideoUrl(undefined);
  }, [setRemoteVideoUrl, setVideo]);

  const onNext = useCallback(() => {
    if (!hasExistingMedia) {
      Alert.alert('Media required', 'Please keep or upload at least one photo or video.');
      return;
    }
    navigation.navigate('EditProductDetailsStep');
  }, [hasExistingMedia, navigation]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader title={categoryName} backgroundColor={styles.screen.backgroundColor} onBack={() => navigation.goBack()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {!playbackVideo ? (
          <>
            <MediaPickerCard title="Upload Video" subtitle="Max video duration 2 mins (optional)" icon="cloud-upload-outline" onPress={pickVideoFromGallery} />
            <Text style={styles.orText}>Or</Text>
            <MediaPickerCard title="Capture Video" subtitle="Max video duration 2 mins (optional)" icon="video-outline" onPress={captureVideo} />
          </>
        ) : (
          <VideoPreview video={playbackVideo} onDelete={clearVideo} onReplace={pickVideoFromGallery} />
        )}
        <View style={styles.tipBox}>
          <Icon name="image-filter-hdr" size={20} color="#0066CC" />
          <Text style={styles.tipText}>You can update photos in the next step.</Text>
        </View>
      </ScrollView>
      <CreatePostFooter backgroundColor={styles.screen.backgroundColor} step={1} onNext={onNext} disabled={!hasExistingMedia} />
    </View>
  );
};
