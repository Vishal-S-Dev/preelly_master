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
  const { categoryName, setVideo, remoteVideoUrl, images } = useEditProductStore();
  const { video, pickVideoFromGallery, captureVideo } = useEditMediaPicker();

  const hasExistingMedia = Boolean(video || remoteVideoUrl || images.length > 0);

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
        {!video ? (
          <>
            {remoteVideoUrl ? (
              <View style={styles.helperBanner}>
                <Text style={styles.helperBannerText}>
                  Current video is saved. Upload a new video only if you want to replace it.
                </Text>
              </View>
            ) : null}
            <MediaPickerCard title="Upload Video" subtitle="Max video duration 2 mins (optional)" icon="cloud-upload-outline" onPress={pickVideoFromGallery} />
            <Text style={styles.orText}>Or</Text>
            <MediaPickerCard title="Capture Video" subtitle="Max video duration 2 mins (optional)" icon="video-outline" onPress={captureVideo} />
          </>
        ) : (
          <VideoPreview video={video} onDelete={() => setVideo(null)} onReplace={pickVideoFromGallery} />
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
