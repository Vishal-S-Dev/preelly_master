import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { formatVideoTime } from '../../../utils/videoTime';

interface Props {
  visible: boolean;
  thumbnailUri?: string | null;
  timeSec: number;
}

export const ThumbnailPreviewPopup = memo<Props>(({ visible, thumbnailUri, timeSec }) => {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(80)}
      style={styles.container}
      pointerEvents="none">
      <View style={styles.card}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.time}>{formatVideoTime(timeSec)}</Text>
    </Animated.View>
  );
});

ThumbnailPreviewPopup.displayName = 'ThumbnailPreviewPopup';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -108,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  card: {
    width: 120,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
  time: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
