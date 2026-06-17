import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import { FeedItem } from '../../domain/models/FeedItem';
import { ActionButtons } from './ActionButtons';

interface Props {
  item: FeedItem;
  isActive: boolean;
  muted: boolean;
  onLike: (id: string) => void;
  onTogglePause: (id: string) => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}

export const VideoCard: React.FC<Props> = React.memo(
  ({ item, isActive, muted, onLike, onTogglePause, onSwipeUp, onSwipeDown }) => {
    const [buffering, setBuffering] = useState(false);
    const heartScale = useSharedValue(0);
    const heartOpacity = useSharedValue(0);

    const heartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
      opacity: heartOpacity.value,
    }));

    const pauseState = !isActive || item.isPaused;
    const showVideo = item.mediaType === 'video';

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(onLike)(item.id);
        heartScale.value = 0.4;
        heartOpacity.value = 1;
        heartScale.value = withSpring(1.1, undefined, () => {
          heartScale.value = withTiming(0.85, { duration: 150 });
          heartOpacity.value = withTiming(0, { duration: 260 });
        });
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(280)
      .onEnd(() => runOnJS(onTogglePause)(item.id));

    const swipeGesture = Gesture.Pan().onEnd(event => {
      if (event.translationY < -90 || event.velocityY < -980) {
        runOnJS(onSwipeUp)();
      }
      if (event.translationY > 90 || event.velocityY > 980) {
        runOnJS(onSwipeDown)();
      }
    });

    const combinedGesture = useMemo(
      () => Gesture.Simultaneous(swipeGesture, Gesture.Exclusive(doubleTap, singleTap)),
      [swipeGesture, doubleTap, singleTap],
    );

    return (
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container}>
          {showVideo ? (
            <Video
              source={{ uri: item.mediaUrl }}
              poster={item.thumbnail}
              posterResizeMode="cover"
              style={styles.media}
              paused={pauseState}
              muted={muted}
              resizeMode="cover"
              repeat
              onBuffer={event => setBuffering(event.isBuffering)}
            />
          ) : (
            <Image source={{ uri: item.mediaUrl }} style={styles.media} resizeMode="cover" />
          )}

          {buffering ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          ) : null}

          <Animated.Text style={[styles.heart, heartStyle]}>❤️</Animated.Text>
          <ActionButtons
            likesCount={item.likes}
            commentsCount={item.comments}
            sharesCount={item.shares}
            isLiked={item.isLiked}
            isSaved={false}
            avatar={item.user.avatar}
            onLike={() => onLike(item.id)}
            onSave={() => undefined}
            onQuickView={() => undefined}
            onComment={() => undefined}
          />

          <View style={styles.bottomMeta}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
              {item.isAvailable ? (
                <View style={styles.availableBadge}>
                  <Text style={styles.availableText}>Available</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },
  media: { ...StyleSheet.absoluteFill },
  loaderWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    fontSize: 80,
  },
  bottomMeta: { paddingHorizontal: 14, paddingBottom: 108, zIndex: 8 },
  title: { color: '#fff', fontSize: 31 / 2, fontWeight: '700' },
  subtitle: { color: '#D1D5DB', fontSize: 14, marginTop: 6 },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    gap: 8,
  },
  priceBadge: {
    backgroundColor: 'rgba(17,24,39,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  availableBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
