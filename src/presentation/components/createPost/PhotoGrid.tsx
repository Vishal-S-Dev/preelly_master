import React, { memo, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostImageAsset } from '../../../types/createPost.types';
import { filterRenderableCreatePostImages } from '../../../utils/createPostImageUtils';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';

interface Props {
  images: CreatePostImageAsset[];
  onRemove: (id: string) => void;
  styles: CreatePostStyles;
}

export const PhotoGrid = memo<Props>(({ images, onRemove, styles }) => {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const renderableImages = filterRenderableCreatePostImages(images);

  if (!renderableImages.length) return null;

  return (
    <>
      <View style={styles.imageGrid}>
        {renderableImages.map(image => (
          <Pressable key={image.id} style={styles.imageTile} onPress={() => setPreviewUri(image.uri)}>
            <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} />
            <Pressable
              onPress={() => onRemove(image.id)}
              style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 4 }}>
              <Icon name="close" size={14} color="#fff" />
            </Pressable>
          </Pressable>
        ))}
      </View>
      <Modal visible={Boolean(previewUri)} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }} onPress={() => setPreviewUri(null)}>
          {previewUri ? <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </>
  );
});

PhotoGrid.displayName = 'PhotoGrid';
