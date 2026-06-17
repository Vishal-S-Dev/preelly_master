import React, { memo } from 'react';
import { Image, Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostImageAsset } from '../../../types/createPost.types';
import { cpStyles } from './createPostStyles';

interface Props {
  images: CreatePostImageAsset[];
  onRemove: (id: string) => void;
}

export const ImageGrid = memo<Props>(({ images, onRemove }) => (
  <View style={cpStyles.imageGrid}>
    {images.map(image => (
      <View key={image.id} style={cpStyles.imageTile}>
        <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} />
        <Pressable
          onPress={() => onRemove(image.id)}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 12,
            padding: 4,
          }}>
          <Icon name="close" size={14} color="#fff" />
        </Pressable>
      </View>
    ))}
  </View>
));

ImageGrid.displayName = 'ImageGrid';
