import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import UploadIcon from '../../../../assets/icons/icn_upload.svg';
import CameraIcon from '../../../../assets/icn_camera.svg';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { MediaPickerCard } from '../../components/createPost/MediaPickerCard';
import { MediaUploadTips } from '../../components/createPost/MediaUploadTips';
import { VideoPreview } from '../../components/createPost/VideoPreview';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { cpStyles } from '../../components/createPost/createPostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostMediaStep'>;

export const MediaUploadStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryName, setVideo } = useCreatePostStore();
  const { video, pickVideoFromGallery, captureVideo } = useMediaPicker();
  const [matchedCardHeight, setMatchedCardHeight] = useState<number | null>(null);

  const onNext = useCallback(() => {
    if (!video) {
      Alert.alert(
        'Video required',
        'Please upload or capture a video (max 2 mins).',
      );
      return;
    }
    navigation.navigate('CreatePostProcessing');
    //navigation.navigate('CreatePostPlaceAnAd');
    //navigation.replace('CreatePostDetailsStep');

  }, [navigation, video]);

  const onUploadCardLayout = useCallback((height: number) => {
    if (height <= 0) {
      return;
    }
    setMatchedCardHeight(prev =>
      prev == null || Math.abs(prev - height) > 1 ? height : prev,
    );
  }, []);

  const equalCardStyle =
    matchedCardHeight != null
      ? { height: matchedCardHeight, minHeight: matchedCardHeight }
      : undefined;

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={categoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!video ? (
          <>
            <MediaPickerCard
              title="Upload Video"
              subtitle="Max video duration 2 mins"
              iconElement={<UploadIcon width={54} height={38} />}
              onPress={pickVideoFromGallery}
              style={equalCardStyle}
              onLayout={e => {
                if (matchedCardHeight == null) {
                  onUploadCardLayout(e.nativeEvent.layout.height);
                }
              }}
            >
              <MediaUploadTips />
            </MediaPickerCard>

            <Text style={cpStyles.orText}>Or</Text>

            <MediaPickerCard
              title="Capture Video"
              subtitle="Max video duration 2 mins"
              iconElement={<CameraIcon width={48} height={43} />}
              onPress={captureVideo}
              style={equalCardStyle}
            />
          </>
        ) : (
          <VideoPreview
            video={video}
            onDelete={() => setVideo(null)}
            onReplace={pickVideoFromGallery}
          />
        )}
      </ScrollView>
      <CreatePostFooter
        backgroundColor={styles.screen.backgroundColor}
        step={1}
        total={5}
        onNext={onNext}
        disabled={!video}
      />
    </View>
  );
};
