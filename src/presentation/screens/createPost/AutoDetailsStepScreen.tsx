import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VIDEO_CONSTRAINTS } from '../../../constants/createPostConstants';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostImageAsset, CreatePostStackParamList } from '../../../types/createPost.types';
import { AppInput } from '../../components/createPost/AppInput';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { PhotoGrid } from '../../components/createPost/PhotoGrid';
import { VideoFramePickerModal } from '../../components/createPost/VideoFramePickerModal';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { filterRenderableCreatePostImages } from '../../../utils/createPostImageUtils';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostDetailsStep'>;

export const AutoDetailsStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const {
    subcategoryName,
    title,
    description,
    images,
    video,
    transcript,
    setTitle,
    setDescription,
    setImages,
    removeImage,
    updateImage,
  } = useCreatePostStore();
  const { pickImages, pickImageToReplace } = useMediaPicker();
  const [framePickerVisible, setFramePickerVisible] = useState(false);
  const displayImages = useMemo(() => filterRenderableCreatePostImages(images), [images]);
  const atImageLimit = images.length >= VIDEO_CONSTRAINTS.maxImages;

  const handlePhotosChange = useCallback(
    (nextImages: CreatePostImageAsset[]) => {
      setImages(nextImages);
    },
    [setImages],
  );

  const handleUpdateImage = useCallback(
    (id: string, updates: Partial<CreatePostImageAsset>) => {
      updateImage(id, updates);
    },
    [updateImage],
  );

  const onNext = useCallback(() => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Please add title and description.');
      return;
    }
    if (displayImages.length === 0) {
      Alert.alert('Required', 'Please add at least one photo.');
      return;
    }
    navigation.navigate('CreatePostFormStep');
  }, [description, displayImages.length, navigation, title]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={subcategoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {!transcript ? (
          <View style={styles.helperBanner}>
            <Text style={styles.helperBannerText}>
              Transcription incomplete. You can enter details manually.
            </Text>
          </View>
        ) : null}
        <AppInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          required
          placeholder="Listing title"
        />
        <AppInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          required
          multiline
          placeholder="Description"
        />
        <Text style={styles.sectionTitle}>
          Photos <Text style={styles.photoLimitText}>(Max {VIDEO_CONSTRAINTS.maxImages} images)</Text>
        </Text>

        {displayImages.length > 0 ? (
          <PhotoGrid
            images={displayImages}
            onRemove={removeImage}
            onReplace={pickImageToReplace}
            onUpdate={handleUpdateImage}
            onPhotosChange={handlePhotosChange}
            styles={styles}
          />
        ) : (
          <View style={styles.helperBanner}>
            <Text style={styles.helperBannerText}>
              Video screenshots will appear here after processing. You can also
              use Screen Grab or Add Photos.
            </Text>
          </View>
        )}
        <View style={styles.photoActionRow}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              video
                ? setFramePickerVisible(true)
                : Alert.alert('Upload video first')
            }
          >
            <Text style={styles.secondaryBtnText}>Screen Grab</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, atImageLimit && styles.secondaryBtnDisabled]}
            disabled={atImageLimit}
            onPress={() => {
              if (atImageLimit) {
                Alert.alert('Limit reached', 'Maximum 10 photos allowed.');
                return;
              }
              pickImages();
            }}
          >
            <Text style={styles.secondaryBtnText}>Add Photos</Text>
          </Pressable>
        </View>
      </ScrollView>
      <CreatePostFooter
        backgroundColor={styles.screen.backgroundColor}
        step={2}
        onNext={onNext}
        disabled={!title.trim() || !description.trim()}
      />
      <VideoFramePickerModal
        visible={framePickerVisible}
        video={video ?? null}
        onClose={() => setFramePickerVisible(false)}
      />
    </View>
  );
};
