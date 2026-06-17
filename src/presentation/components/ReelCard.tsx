import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Product } from '../../domain/models/Product';
import { ActionButtons } from './ActionButtons';
import { VideoPlayer, VideoPlayerFullscreen } from './VideoPlayer';

interface Props {
  product: Product;
  isActive: boolean;
  muted: boolean;
  onTogglePause: (id: string) => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onQuickView: (product: Product) => void;
  onComment: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onOpenProfile: (id: string) => void;
  onShare?: (product: Product) => void;
  fullscreenVideo?: boolean;
}

const areReelCardPropsEqual = (prev: Props, next: Props): boolean =>
  prev.product.id === next.product.id &&
  prev.isActive === next.isActive &&
  prev.muted === next.muted &&
  prev.product.isPaused === next.product.isPaused &&
  prev.product.liked === next.product.liked &&
  prev.product.isSaved === next.product.isSaved &&
  prev.product.likesCount === next.product.likesCount &&
  prev.product.commentCount === next.product.commentCount &&
  prev.product.videoUrl === next.product.videoUrl &&
  prev.product.imageUrl === next.product.imageUrl &&
  prev.fullscreenVideo === next.fullscreenVideo;

export const ReelCard: React.FC<Props> = React.memo(
  ({
    product,
    isActive,
    muted,
    onTogglePause,
    onLike,
    onSave,
    onQuickView,
    onComment,
    onOpenDetail,
    onOpenProfile,
    onShare,
    fullscreenVideo = false,
  }) => {
    const heartScale = useSharedValue(0);
    const heartOpacity = useSharedValue(0);

    const heartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
      opacity: heartOpacity.value,
    }));

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(onLike)(product.id);
        heartScale.value = 0.2;
        heartOpacity.value = 1;
        heartScale.value = withSpring(1.1, undefined, () => {
          heartScale.value = withTiming(0.85, { duration: 120 });
          heartOpacity.value = withTiming(0, { duration: 280 });
        });
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .onEnd(() => runOnJS(onTogglePause)(product.id));

    const combinedGesture = useMemo(
      () => Gesture.Exclusive(doubleTap, singleTap),
      [doubleTap, singleTap],
    );

    const Player = fullscreenVideo ? VideoPlayerFullscreen : VideoPlayer;

    return (
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container}>
          <Player
            videoUrl={product.videoUrl}
            imageUrl={product.imageUrl}
            isActive={isActive}
            muted={muted}
            isPaused={product.isPaused}
          />

          <View style={styles.topOverlay} />
          <View style={styles.bottomOverlay} />

          <Animated.Text style={[styles.heart, heartStyle]}>❤️</Animated.Text>

          <ActionButtons
            likesCount={product.likesCount}
            commentsCount={product.commentCount ?? 0}
            sharesCount={0}
            isLiked={product.liked}
            isSaved={product.isSaved}
            avatar={product.seller?.avatar}
            onLike={() => onLike(product.id)}
            onSave={() => onSave(product.id)}
            onQuickView={() => onQuickView(product)}
            onComment={() => onComment(product)}
            onShare={onShare ? () => onShare(product) : undefined}
            onProfileView={() => {
              const sellerId = product.seller?.id;
              if (sellerId) {
                onOpenProfile(sellerId);
              }
            }}
          />
          {/* Bottom Content Section */}
          <View style={styles.bottom}>
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {product.title}
              </Text>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {product.currency} {product.price.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.descRow}>
              <View style={styles.specsRow}>
                {/*<Text style={styles.description}>2022</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.description}>76,500 km</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.description}>American Specs</Text>*/}
                <Text style={styles.description}>{product.location}</Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationText}>Available</Text>
              </View>
            </View>
          </View>

          {/*<Pressable
            style={styles.bottomInfo}
            onPress={() => onOpenDetail(product)}
          >
            <Text style={styles.title} numberOfLines={1}>
              {product.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {product.currency} {product.price.toLocaleString()}
                </Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationText}>{product.location}</Text>
              </View>
            </View>
          </Pressable>*/}
        </View>
      </GestureDetector>
    );
  },
  areReelCardPropsEqual,
);

ReelCard.displayName = 'ReelCard';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },
  topOverlay: {
    ...StyleSheet.absoluteFill,
    bottom: '60%',
    //backgroundColor: 'rgba(0,0,0,0.20)',
  },
  bottomOverlay: {
    ...StyleSheet.absoluteFill,
    top: '45%',
    //backgroundColor: 'rgba(0,0,0,0.34)',
  },
  heart: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    fontSize: 80,
  },
  bottomInfo: { paddingHorizontal: 16, paddingBottom: 110, paddingRight: 90 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 },
  description: { color: '#E2E8F0', marginTop: 6, fontSize: 14, },
  badgeRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: 'rgba(17,24,39,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: { color: '#fff', fontWeight: '800', flexShrink: 0 },
  locationBadge: {
    backgroundColor: '#1EB700',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'center',
  },
  locationText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    flexShrink: 0,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#FFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#999',
    marginHorizontal: 8,
  },
  bottom: {
    paddingBottom: 85,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  descRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  availabilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingBottom: 110,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
