import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VIDEO_CONSTRAINTS } from '../../../../../constants/createPostConstants';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { EditProductImageAsset, EditProductStackParamList } from '../../../../../types/editProduct.types';
import { AppInput } from '../../../../components/createPost/AppInput';
import { CreatePostFooter, CreatePostHeader } from '../../../../components/createPost/StepIndicator';
import { PhotoGrid } from '../../../../components/createPost/PhotoGrid';
import { EditVideoFramePickerModal } from '../components/EditVideoFramePickerModal';
import { useCreatePostStyles } from '../../../../hooks/useCreatePostStyles';
import { useEditMediaPicker } from '../hooks/useEditMediaPicker';
import { filterEditProductImages } from '../utils/editProductImageUtils';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductDetailsStep'>;

export const EditDetailsStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const {
    subcategoryName,
    title,
    description,
    images,
    setTitle,
    setDescription,
    setImages,
    removeImage,
    updateImage,
  } = useEditProductStore();
  const { pickImages, pickImageToReplace, playbackVideo } = useEditMediaPicker();
  const [framePickerVisible, setFramePickerVisible] = useState(false);
  const [grabReplaceImageId, setGrabReplaceImageId] = useState<string | null>(null);

  const displayImages = useMemo(() => filterEditProductImages(images), [images]);
  const atImageLimit = displayImages.length >= VIDEO_CONSTRAINTS.maxImages;

  useEffect(() => {
    const validImages = filterEditProductImages(images);
    if (validImages.length !== images.length) {
      setImages(validImages);
    }
  }, [images, setImages]);

  const openScreenGrab = useCallback((replaceImageId?: string) => {
    if (!playbackVideo) {
      Alert.alert('Video required', 'Add a video to capture screenshots from.');
      return;
    }
    setGrabReplaceImageId(replaceImageId ?? null);
    setFramePickerVisible(true);
  }, [playbackVideo]);

  const closeScreenGrab = useCallback(() => {
    setFramePickerVisible(false);
    setGrabReplaceImageId(null);
  }, []);

  const handleGrabImage = useCallback(
    (imageId: string) => {
      openScreenGrab(imageId);
    },
    [openScreenGrab],
  );

  const handlePhotosChange = useCallback(
    (nextImages: EditProductImageAsset[]) => {
      setImages(filterEditProductImages(nextImages));
    },
    [setImages],
  );

  const handleUpdateImage = useCallback(
    (id: string, updates: Partial<EditProductImageAsset>) => {
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
    navigation.navigate('EditProductFormStep');
  }, [description, displayImages.length, navigation, title]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={subcategoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
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
            onGrab={handleGrabImage}
            onUpdate={handleUpdateImage}
            onPhotosChange={handlePhotosChange}
            styles={styles}
          />
        ) : (
          <View style={styles.helperBanner}>
            <Text style={styles.helperBannerText}>Add at least one photo for your listing.</Text>
          </View>
        )}
        <View style={styles.photoActionRow}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => openScreenGrab()}>
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
            }}>
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
      <EditVideoFramePickerModal
        visible={framePickerVisible}
        video={playbackVideo ?? null}
        replaceImageId={grabReplaceImageId}
        onClose={closeScreenGrab}
      />
    </View>
  );
};
