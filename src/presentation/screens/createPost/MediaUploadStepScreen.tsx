import React, { useCallback } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { MediaPickerCard } from '../../components/createPost/MediaPickerCard';
import { VideoPreview } from '../../components/createPost/VideoPreview';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostMediaStep'>;

export const MediaUploadStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryName, setVideo } = useCreatePostStore();
  const { video, pickVideoFromGallery, captureVideo } = useMediaPicker();

  const onNext = useCallback(() => {
    if (!video) {
      Alert.alert('Video required', 'Please upload or capture a video (max 2 mins).');
      return;
    }
    navigation.navigate('CreatePostProcessing');
    //navigation.navigate('CreatePostDetailsStep');
  }, [navigation, video]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader title={categoryName} backgroundColor={styles.screen.backgroundColor} onBack={() => navigation.goBack()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {!video ? (
          <>
            <MediaPickerCard title="Upload Video" subtitle="Max video duration 2 mins" icon="cloud-upload-outline" onPress={pickVideoFromGallery} />
            <Text style={styles.orText}>Or</Text>
            <MediaPickerCard title="Capture Video" subtitle="Max video duration 2 mins" icon="video-outline" onPress={captureVideo} />
          </>
        ) : (
          <VideoPreview video={video} onDelete={() => setVideo(null)} onReplace={pickVideoFromGallery} />
        )}
        <View style={styles.tipBox}>
          <Icon name="image-filter-hdr" size={20} color="#0066CC" />
          <Text style={styles.tipText}>Show the item from multiple angles for the best results.</Text>
        </View>
      </ScrollView>
      <CreatePostFooter backgroundColor={styles.screen.backgroundColor} step={1} onNext={onNext} disabled={!video} />
    </View>
  );
};
