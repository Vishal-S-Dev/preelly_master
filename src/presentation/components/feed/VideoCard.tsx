import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Video from 'react-native-video';
import { VideoModel } from '../../../domain/models/VideoModel';

const { height } = Dimensions.get('window');

interface Props {
  item: VideoModel;
  isActive: boolean;
  onLike: (id: string) => void;
}

export const VideoCard: React.FC<Props> = React.memo(({ item, isActive, onLike }) => {
  const likeScale = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      likeScale.value = withSpring(1, undefined, () => {
        likeScale.value = withSpring(0);
      });
      onLike(item.id);
    });

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={styles.container}>
        <Video source={{ uri: item.videoUrl }} style={styles.video} repeat paused={!isActive} resizeMode="cover" />
        <Animated.Text style={[styles.heart, style]}>❤️</Animated.Text>
        <View style={styles.meta}>
          <Text style={styles.user}>@{item.username}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.likes}>{item.likesCount} likes</Text>
        </View>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: { height, justifyContent: 'flex-end', backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFill },
  meta: { padding: 16 },
  user: { color: '#fff', fontWeight: '700' },
  description: { color: '#fff', marginTop: 4 },
  likes: { color: '#fff', marginTop: 8 },
  heart: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    fontSize: 60,
  },
});
