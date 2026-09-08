import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Product } from '../../domain/models/Product';
import { shouldSkipProductView } from '../../services/productView.service';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { markProductViewed } from '../redux/slices/productSlice';
import { ActionButtons } from './ActionButtons';
import { GradientPriceBadge } from './common/GradientPriceBadge';
import { VideoPlayer, VideoPlayerFullscreen } from './VideoPlayer';
import LinearGradient from "react-native-linear-gradient";

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
  /** Called after a view is successfully recorded (for local feed state). */
  onProductViewed?: (productId: string) => void;
  fullscreenVideo?: boolean;
  ownerMode?: boolean;
  onOwnerMenu?: (product: Product) => void;
}

// Max gap between two taps for them to count as a double tap. Disambiguation is done in JS
// (see `handleTapEnd` below) rather than via `Gesture.Exclusive`'s native require-to-fail
// relationship: on-device testing showed a lone tap's `singleTap` gesture never resolves at
// all when composed that way — `doubleTap`'s native recognizer does not reliably transition
// to FAILED after `maxDelay` elapses with no second tap, so `singleTap` (which depends on
// that failure) just hangs and its `onEnd` never fires. A plain JS counter/timer sidesteps
// that native reliability gap entirely.
const DOUBLE_TAP_WINDOW_MS = 250;

// Once a double tap has fired, ignore a trailing third tap's solo-tap timeout so a rapid
// triple tap can't sneak in an unwanted play/pause toggle right after the like.
const DOUBLE_TAP_GUARD_MS = 400;

// Base clearance for the product-info block above the floating capsule nav (collapsed circle
// ~56pt + its own bottom margin) — the device's bottom safe-area inset (home indicator /
// gesture-nav bar) is added on top of this per-device, not baked into the constant itself.
const FLOATING_NAV_CLEARANCE = 70;

const areReelCardPropsEqual = (prev: Props, next: Props): boolean =>
  prev.product.id === next.product.id &&
  prev.isActive === next.isActive &&
  prev.muted === next.muted &&
  prev.ownerMode === next.ownerMode &&
  prev.product.isPaused === next.product.isPaused &&
  prev.product.liked === next.product.liked &&
  prev.product.isSaved === next.product.isSaved &&
  prev.product.isViewed === next.product.isViewed &&
  prev.product.isSold === next.product.isSold &&
  prev.product.likesCount === next.product.likesCount &&
  prev.product.commentCount === next.product.commentCount &&
  prev.product.videoUrl === next.product.videoUrl &&
  prev.product.imageUrl === next.product.imageUrl &&
  prev.fullscreenVideo === next.fullscreenVideo &&
  prev.onProductViewed === next.onProductViewed;

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
    onProductViewed,
    fullscreenVideo = false,
    ownerMode = false,
    onOwnerMenu,
  }) => {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const isGuest = useAppSelector(state => state.auth.isGuest);
    const heartScale = useSharedValue(0);
    const heartOpacity = useSharedValue(0);

    // Instagram-style center play/pause glyph: flashes briefly on every tap-toggle, then
    // fades out on its own regardless of the resulting play/pause state.
    const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
    const centerIconOpacity = useSharedValue(0);
    const centerIconScale = useSharedValue(0.8);

    const centerIconStyle = useAnimatedStyle(() => ({
      opacity: centerIconOpacity.value,
      transform: [{ scale: centerIconScale.value }],
    }));

    const clearCenterIcon = useCallback(() => {
      setCenterIcon(null);
    }, []);

    const flashCenterIcon = useCallback(
      (nextPaused: boolean) => {
        setCenterIcon(nextPaused ? 'pause' : 'play');
        centerIconScale.value = 0.8;
        centerIconScale.value = withTiming(1, { duration: 180 });
        centerIconOpacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(
            350,
            withTiming(0, { duration: 220 }, finished => {
              if (finished) {
                runOnJS(clearCenterIcon)();
              }
            }),
          ),
        );
      },
      [centerIconOpacity, centerIconScale, clearCenterIcon],
    );

    const hasVideo = product.videoUrl.trim().length > 0;
    const isSold = Boolean(product.isSold);
    const availabilityLabel = isSold ? 'Sold' : 'Available';
    const watchTrackingEnabled =
      hasVideo &&
      isAuthenticated &&
      !isGuest &&
      !shouldSkipProductView(product.id, product.isViewed);

    const handleWatchThresholdReached = useCallback(() => {
      if (shouldSkipProductView(product.id, product.isViewed)) {
        return;
      }

      void dispatch(
        markProductViewed({ productId: product.id, isViewed: product.isViewed }),
      ).then(result => {
        if (markProductViewed.fulfilled.match(result) && result.payload.recorded) {
          onProductViewed?.(product.id);
        }
      });
    }, [dispatch, onProductViewed, product.id, product.isViewed]);

    const heartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
      opacity: heartOpacity.value,
    }));

    // Latest callback/id snapshot, refreshed every render but never causing the gesture
    // objects below to be rebuilt — keeps the native tap handlers alive across redux-driven
    // re-renders (pause/like state, active index, etc.) instead of tearing them down and
    // reinstalling them, which is what was dropping taps intermittently on both platforms.
    const latestRef = useRef({
      onLike,
      onTogglePause,
      productId: product.id,
      liked: product.liked,
      isPaused: product.isPaused,
    });
    latestRef.current = {
      onLike,
      onTogglePause,
      productId: product.id,
      liked: product.liked,
      isPaused: product.isPaused,
    };

    // Timestamp of the last recognized double tap, used only by the solo-tap timeout's
    // stray-tap guard below — not a debounce for the like action itself.
    const lastDoubleTapAtRef = useRef(0);

    // JS-side single/double tap disambiguation state (see `DOUBLE_TAP_WINDOW_MS` above for why
    // this isn't done via native gesture composition). `pendingTapTimerRef` holds the timer
    // started after the first tap of a possible pair; a second tap arriving before it fires
    // cancels it and counts as a double tap, otherwise it fires as a single tap.
    const pendingTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
      () => () => {
        if (pendingTapTimerRef.current) {
          clearTimeout(pendingTapTimerRef.current);
        }
      },
      [],
    );

    const triggerLike = useCallback(() => {
      lastDoubleTapAtRef.current = Date.now();

      // Instagram-style double tap: always likes, never unlikes. Unliking stays the
      // dedicated Like button's job (`ActionButtons`). Checking (and immediately flipping)
      // the ref — rather than waiting for the next render's `product.liked` prop — is what
      // stops a rapid second/third double tap from re-dispatching the like request before
      // the optimistic Redux update has flowed back down as a new prop.
      if (!latestRef.current.liked) {
        latestRef.current.liked = true;
        latestRef.current.onLike(latestRef.current.productId);
      }

      heartScale.value = 0.2;
      heartOpacity.value = 1;
      heartScale.value = withSpring(1.1, undefined, () => {
        heartScale.value = withTiming(0.85, { duration: 120 });
        heartOpacity.value = withTiming(0, { duration: 280 });
      });
    }, [heartOpacity, heartScale]);

    const triggerTogglePause = useCallback(() => {
      if (Date.now() - lastDoubleTapAtRef.current < DOUBLE_TAP_GUARD_MS) {
        return;
      }
      const nextPaused = !latestRef.current.isPaused;
      latestRef.current.onTogglePause(latestRef.current.productId);
      flashCenterIcon(nextPaused);
    }, [flashCenterIcon]);

    // Dev-only gesture instrumentation for manual on-device QA. Guarded by `__DEV__` so it
    // never runs (or costs anything) in production builds.
    const logTapDetected = useCallback((kind: 'single' | 'double') => {
      if (__DEV__) {
        console.log(`[Gesture][${kind}Tap] detected productId=${latestRef.current.productId}`);
      }
    }, []);

    const handleTapEnd = useCallback(() => {
      if (pendingTapTimerRef.current) {
        // Second tap arrived inside the window — it's a double tap.
        clearTimeout(pendingTapTimerRef.current);
        pendingTapTimerRef.current = null;
        logTapDetected('double');
        triggerLike();
        return;
      }

      pendingTapTimerRef.current = setTimeout(() => {
        pendingTapTimerRef.current = null;
        logTapDetected('single');
        triggerTogglePause();
      }, DOUBLE_TAP_WINDOW_MS);
    }, [logTapDetected, triggerLike, triggerTogglePause]);

    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .maxDuration(250)
          .onEnd((_event, success) => {
            if (success) {
              runOnJS(handleTapEnd)();
            }
          }),
      [handleTapEnd],
    );

    const Player = fullscreenVideo ? VideoPlayerFullscreen : VideoPlayer;

    return (
      <View style={styles.container}>
        {/* Only the video itself is wrapped by the tap gesture — ActionButtons and the bottom
            title/location Pressables below are rendered as siblings, not descendants, of this
            GestureDetector. Gesture-handler recognizers fire for a touch's whole ancestor chain,
            so nesting those buttons inside here made every button tap also register as a
            single/double tap on the video (pausing it or firing a phantom like) alongside its
            own onPress. Keeping them as siblings removes the video's Tap gesture from that
            ancestor chain, so a button tap only ever fires the button's own handler. */}
        <GestureDetector gesture={tapGesture}>
          <View style={styles.videoGestureArea}>
            <Player
              videoUrl={product.videoUrl}
              imageUrl={product.imageUrl}
              isActive={isActive}
              muted={muted}
              isPaused={product.isPaused}
              watchTrackingEnabled={watchTrackingEnabled}
              onWatchThresholdReached={
                watchTrackingEnabled ? handleWatchThresholdReached : undefined
              }
            />
          </View>
        </GestureDetector>

        <View style={styles.topOverlay} />
        <View style={styles.bottomOverlay} />

        <Animated.Text style={[styles.heart, heartStyle]}>❤️</Animated.Text>

        {centerIcon ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.centerIconBubble, centerIconStyle]}>
            <Ionicons
              name={centerIcon === 'pause' ? 'pause' : 'play'}
              size={40}
              color="#fff"
              style={centerIcon === 'play' ? styles.centerIconPlayGlyph : undefined}
            />
          </Animated.View>
        ) : null}

        <ActionButtons
          likesCount={product.likesCount}
          commentsCount={product.commentCount ?? 0}
          sharesCount={0}
          isLiked={product.liked}
          isSaved={product.isSaved}
          avatar={product.seller?.avatar}
          ownerMode={ownerMode}
          onLike={() => onLike(product.id)}
          onSave={() => onSave(product.id)}
          onQuickView={() => onQuickView(product)}
          onComment={() => onComment(product)}
          onShare={onShare ? () => onShare(product) : undefined}
          onOwnerMenu={
            ownerMode && onOwnerMenu ? () => onOwnerMenu(product) : undefined
          }
          onProfileView={() => {
            const sellerId = product.seller?.id;
            if (sellerId) {
              onOpenProfile(sellerId);
            }
          }}
        />
        {/* Bottom Content Section */}
        <LinearGradient
          colors={[
            'rgba(2, 2, 2, 0.62)',
            'rgba(17,24,39,0)',
          ]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.bottomShadow}
        />
        <View style={[styles.bottom, { paddingBottom: FLOATING_NAV_CLEARANCE + insets.bottom }]}>
          <View style={styles.row}>
            <Pressable
              style={styles.titlePressable}
              onPress={() => onOpenDetail(product)}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${product.title}`}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {product.title}
              </Text>
            </Pressable>
            <GradientPriceBadge
              currency={product.currency}
              price={product.price}
              size="compact"
            />
          </View>
          <View style={styles.descRow}>
            <View style={styles.specsRow}>
              {/*<Text style={styles.description}>2022</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.description}>76,500 km</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.description}>American Specs</Text>*/}
              <Pressable
                style={styles.locationPressable}
                onPress={() => onOpenDetail(product)}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${product.title}`}>
                <Text
                  style={styles.description}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {product.location}
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.locationBadge,
                isSold ? styles.soldBadge : styles.availableBadge,
              ]}
            >
              <Text style={styles.locationText}>{availabilityLabel}</Text>
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
    );
  },
  areReelCardPropsEqual,
);

ReelCard.displayName = 'ReelCard';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },
  videoGestureArea: { ...StyleSheet.absoluteFill },
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
  centerIconBubble: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    marginTop: -42,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The play glyph's triangle isn't visually centered within its own bounding box —
  // nudge it right so it reads as centered inside the circular bubble.
  centerIconPlayGlyph: {
    marginLeft: 4,
  },
  bottomInfo: { paddingHorizontal: 16, paddingBottom: 110, paddingRight: 90 },
  titlePressable: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  description: { color: '#E2E8F0', marginTop: 6, fontSize: 14, flexShrink: 1 },
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'center',
  },
  availableBadge: {
    backgroundColor: '#1EB700',
  },
  soldBadge: {
    backgroundColor: '#EF4444',
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
    // paddingBottom is supplied inline (FLOATING_NAV_CLEARANCE + insets.bottom above).
    paddingHorizontal: 16,
  },
  bottomShadow: {
    paddingBottom: 0,
    bottom: '0',
    position: 'absolute',
    left: 0,
    right: 0,
    height: 240, // adjust as needed
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  descRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
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
  // `Pressable` defaults to flexShrink: 0, so without this it refused to shrink below the
  // location text's natural (unwrapped) width — pushing the Available/Sold badge off-row
  // instead of letting `numberOfLines`/`ellipsizeMode` on the Text below actually truncate it.
  locationPressable: {
    flexShrink: 1,
  },
});
