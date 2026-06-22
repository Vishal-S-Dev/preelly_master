import React, { memo, useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostImageAsset } from '../../../types/createPost.types';

export interface CapturedFrame extends CreatePostImageAsset {
  capturedAtSec?: number;
}

interface Props {
  frames: CapturedFrame[];
  onRemove: (id: string) => void;
  maxVisible?: number;
}

const THUMB_SIZE = 68;

export const CapturedFramesGrid = memo<Props>(({ frames, onRemove, maxVisible = 10 }) => {
  const handleRemove = useCallback(
    (id: string) => {
      onRemove(id);
    },
    [onRemove],
  );

  if (!frames.length) {
    return null;
  }

  const visibleFrames = frames.slice(-maxVisible);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled">
        {visibleFrames.map(frame => (
          <View key={frame.id} style={styles.thumbWrap}>
            <Image source={{ uri: frame.uri }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.overlay} pointerEvents="box-none">
              <Pressable
                style={styles.deleteBtn}
                hitSlop={8}
                onPress={() => handleRemove(frame.id)}
                accessibilityLabel="Remove captured frame">
                <Icon name="trash-can-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

CapturedFramesGrid.displayName = 'CapturedFramesGrid';

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  row: {
    gap: 8,
    paddingHorizontal: 16,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
