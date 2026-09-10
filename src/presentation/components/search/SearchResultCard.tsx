import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SearchListingItem } from '../../../types/search.types';
import { PromotedBadge } from '../common/PromotedBadge';
import {
  LISTING_STATUS_TONE_STYLES,
  resolveListingStatusBadge,
} from '../../../utils/listingStatusBadge';
import { useAppTheme } from '../../hooks/useAppTheme';

const GRID_HORIZONTAL_PADDING = 0;
const GRID_GAP = 2;
const CARD_ASPECT_RATIO = 1.58;

interface Props {
  item: SearchListingItem;
  onPress?: (item: SearchListingItem) => void;
  onFavorite?: (item: SearchListingItem) => void;
  /** Whether this card is currently visible in the FlatList viewport — mirrors ReelCard's
   * `isActive`, but driven by `onViewableItemsChanged` since a search grid can have several
   * video cards visible at once (unlike the single-active-item reel pager). */
  isVisible?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SearchResultCard = memo<Props>(
  ({ item, onPress, onFavorite, isVisible = false }) => {
    const theme = useAppTheme();
    const { width } = useWindowDimensions();
    const scale = useSharedValue(1);
    const [videoError, setVideoError] = useState(false);
    const [videoBuffering, setVideoBuffering] = useState(false);

    const videoUrl = item.videoUrl;
    const canPlayVideo = Boolean(videoUrl) && !videoError;
    const isPlaying = canPlayVideo && isVisible;

    const handleVideoError = useCallback(() => {
      setVideoError(true);
      setVideoBuffering(false);
    }, []);

    const handleVideoBuffer = useCallback(
      ({ isBuffering }: { isBuffering: boolean }) => {
        setVideoBuffering(isBuffering);
      },
      [],
    );

    const cardWidth = useMemo(
      () => (width - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2,
      [width],
    );
    const cardHeight = useMemo(
      () => cardWidth * CARD_ASPECT_RATIO,
      [cardWidth],
    );

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const priceLabel = `${item.currency} ${item.price.toLocaleString()}`;
    const statusBadge = resolveListingStatusBadge(item);

    return (
      <AnimatedPressable
        onPress={() => onPress?.(item)}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 14 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${priceLabel}`}
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            shadowColor: '#000',
          },
          animStyle,
        ]}
      >
        {/* The shadow lives on this Pressable (unclipped) and the rounded/clipped surface is this
          separate inner View — putting `overflow: hidden` on the same view as `shadowOpacity` on
          iOS forces the shadow to be recomputed from the clipped, ever-changing content every
          frame (no cached shadow bitmap), which is a classic cause of dropped frames on a
          scrolling grid of these. Splitting them lets iOS cache the shadow once per size. */}
        <View style={styles.cardInner}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.image, { backgroundColor: theme.subText + '33' }]}
            />
          )}

          {/* Mounted only while visible: unmounting on scroll-out releases the decoder instead of
          leaving it paused-but-alive, and remounting on re-entry naturally restarts the preview
          from the beginning, matching Instagram's grid-preview behavior. The poster image above
          stays visible underneath until the first frame decodes, so there's never a blank/black
          flash. */}
          {isPlaying && videoUrl ? (
            <Video
              source={{ uri: videoUrl }}
              style={styles.image}
              resizeMode="cover"
              muted
              repeat
              paused={false}
              playInBackground={false}
              playWhenInactive={false}
              poster={item.imageUrl || undefined}
              posterResizeMode="cover"
              onError={handleVideoError}
              onBuffer={handleVideoBuffer}
            />
          ) : null}

          {isPlaying && videoBuffering ? (
            <View style={styles.videoLoader} pointerEvents="none">
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : null}

          <LinearGradient
            colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.15)', 'transparent']}
            locations={[0, 0.55, 1]}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.35, 1]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          {item.isPromoted ? <PromotedBadge style={styles.promotedBadge} /> : null}

          {/*{item.hasVideo ? (
        <View style={styles.playBadge} pointerEvents="none">
          <Icon name="play" size={14} color="#FFFFFF" />
        </View>
      ) : null}*/}

          {/*{onFavorite ? (
        <Pressable
          style={styles.favoriteBtn}
          onPress={() => onFavorite(item)}
          accessibilityRole="button"
          accessibilityLabel={item.isSaved ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={8}
        >
          <Icon
            name={item.isSaved ? 'heart' : 'heart-outline'}
            size={16}
            color={item.isSaved ? theme.danger : '#FFFFFF'}
          />
        </Pressable>
      ) : null}*/}

          <View style={styles.topContent} pointerEvents="none">
            <Text style={styles.title} numberOfLines={3}>
              {item.title}
            </Text>
          </View>

          <View style={styles.bottomContent} pointerEvents="none">
            {/* flexShrink so a long status label never eats into the price's space on the right —
            the badge stays start-aligned and shrinks/truncates before it can push the price off
            the card. */}
            <View style={styles.statusBadgeWrap}>
              {statusBadge ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        LISTING_STATUS_TONE_STYLES[statusBadge.tone]
                          .backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          LISTING_STATUS_TONE_STYLES[statusBadge.tone].color,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {statusBadge.label}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* flex: 1 caps this to whatever width remains after the badge, so the price is always
            end-aligned *within* the card instead of overflowing past its right edge. */}
            <View style={styles.bottomRight}>
              {item.location ? (
                <Text style={styles.location} numberOfLines={1}>
                  {item.location}
                </Text>
              ) : null}
              <Text
                style={styles.price}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                ellipsizeMode="tail"
              >
                {priceLabel}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  },
);

SearchResultCard.displayName = 'SearchResultCard';

export const SEARCH_RESULT_GRID_GAP = GRID_GAP;
export const SEARCH_RESULT_GRID_PADDING = GRID_HORIZONTAL_PADDING;
export const SEARCH_RESULT_CARD_ASPECT_RATIO = CARD_ASPECT_RATIO;

const styles = StyleSheet.create({
  card: {
    // No overflow/borderRadius here on purpose — see the comment above `cardInner` in the JSX.
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: GRID_GAP,
  },
  cardInner: {
    flex: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  videoLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  topContent: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  bottomContent: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statusBadgeWrap: {
    flexShrink: 1,
    alignItems: 'flex-start',
    marginRight: 8,
  },
  bottomRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexShrink: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  location: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 3,
    textAlign: 'right',
    maxWidth: '100%',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  promotedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  playBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
