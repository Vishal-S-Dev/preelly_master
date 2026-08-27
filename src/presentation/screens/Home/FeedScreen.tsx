import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Product } from '../../../domain/models/Product';
import { FeedType } from '../../../data/api/feedApi';
import { Loader } from '../../components/common/Loader';
import { CommentsBottomSheet } from '../../components/comments/CommentsBottomSheet';
import { ProductQuickViewSheet } from '../../components/productQuickView/ProductQuickViewSheet';
import { ReelCard } from '../../components/ReelCard';
import { TopHeader } from '../../components/TopHeader';
import { ReelPlaybackProvider } from '../../context/ReelPlaybackContext';
import { useShareSheet } from '../../context/ShareSheetContext';
import { productToSharePayload } from '../../../utils/shareLinks';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { useProductChatInit } from '../../hooks/useProductChatInit';
import { useReelPlaybackGate } from '../../hooks/useReelPlaybackGate';
import {
  fetchProductsFromFeed,
  likeProduct,
  saveProduct,
  setActiveIndex,
  togglePause,
} from '../../redux/slices/productSlice';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 200,
  itemVisiblePercentThreshold: 80,
};

// TopHeader lays tabs out as "Following" (left) then "Trending" (right). The pager mirrors that
// order so a swipe right (revealing the left neighbour) lands on Following, and a swipe left
// (revealing the right neighbour) lands on Trending — the same relationship a finger has with a
// physical page underneath it.
const FEED_ORDER: FeedType[] = ['following', 'trending'];
const PAGE_X: Record<FeedType, number> = { following: 0, trending: -SCREEN_WIDTH };
const SWIPE_VELOCITY_THRESHOLD = 600;
const SLIDE_DURATION = 240;
const SLIDE_EASING = Easing.out(Easing.cubic);

interface FeedPageProps {
  feedType: FeedType;
  isSelected: boolean;
  muted: boolean;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onQuickView: (product: Product) => void;
  onComment: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onShare: (product: Product) => void;
}

/** One vertically-paged reel feed (Trending or Following). Both are mounted simultaneously and
 * kept preloaded so switching between them is an instant slide rather than a fetch-and-wait. */
const FeedPage: React.FC<FeedPageProps> = ({
  feedType,
  isSelected,
  muted,
  navigation,
  onQuickView,
  onComment,
  onOpenDetail,
  onShare,
}) => {
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList<Product>>(null);
  const { products, page, hasMore, loading, refreshing, activeIndex } = useAppSelector(
    state => state.product.feeds[feedType],
  );

  useEffect(() => {
    if (!products.length) {
      dispatch(fetchProductsFromFeed({ page: 1, feedType }));
    }
    // Preload once on mount regardless of which tab is initially selected — intentionally not
    // re-running when `products.length` changes to 0 for any other reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, feedType]);

  const onRefresh = useCallback(() => {
    dispatch(fetchProductsFromFeed({ page: 1, refresh: true, feedType }));
  }, [dispatch, feedType]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchProductsFromFeed({ page: page + 1, feedType }));
    }
  }, [dispatch, feedType, hasMore, loading, page]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems[0];
      if (typeof firstVisible?.index === 'number') {
        dispatch(setActiveIndex({ feedType, index: firstVisible.index }));
      }
    },
    [dispatch, feedType],
  );

  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
  );

  const renderItem: ListRenderItem<Product> = useCallback(
    ({ item, index }) => (
      <View style={styles.page}>
        <ReelCard
          product={item}
          isActive={isSelected && index === activeIndex}
          muted={muted}
          onTogglePause={id => dispatch(togglePause({ feedType, productId: id }))}
          onLike={id => dispatch(likeProduct(id))}
          onSave={id => dispatch(saveProduct(id))}
          onQuickView={onQuickView}
          onComment={onComment}
          onOpenDetail={onOpenDetail}
          onShare={onShare}
          onOpenProfile={userId => {
            if (userId) {
              navigation.navigate('OtherProfile', { userId });
            }
          }}
        />
      </View>
    ),
    [
      activeIndex,
      dispatch,
      feedType,
      isSelected,
      muted,
      navigation,
      onComment,
      onOpenDetail,
      onQuickView,
      onShare,
    ],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Product> | null | undefined, index: number) => ({
      index,
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
    }),
    [],
  );

  return (
    <View style={styles.pageWrapper}>
      <FlatList
        ref={flatListRef}
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        windowSize={3}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        // NOT removeClippedSubviews: detaching an off-screen reel from the native view tree
        // (pre-mounted here since it's within `windowSize`) and reattaching it once scrolled
        // into view orphans react-native-gesture-handler's native tap recognizer on that view —
        // taps on the reel you just swiped to silently stop registering. windowSize is small
        // enough that the memory tradeoff isn't worth the broken gesture.
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.7}
        ListFooterComponent={loading && products.length > 0 ? <Loader /> : null}
      />
    </View>
  );
};

export const FeedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { openShare } = useShareSheet();
  const { openProductChatFromListing, openingChat } = useProductChatInit();
  const isPlaybackAllowed = useReelPlaybackGate();
  const quickViewRef = useRef<BottomSheetModal>(null);
  const commentsRef = useRef<BottomSheetModal>(null);
  const [muted, setMuted] = useState(false);
  const [selectedFeedType, setSelectedFeedType] = useState<FeedType>('trending');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [commentsProduct, setCommentsProduct] = useState<Product | null>(null);
  const followingProducts = useAppSelector(state => state.product.feeds.following.products);
  const trendingProducts = useAppSelector(state => state.product.feeds.trending.products);

  const translateX = useSharedValue(PAGE_X[selectedFeedType]);
  const pagerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  /** Switches the active tab (used by TopHeader taps AND by the swipe gesture once it settles).
   * Does not itself move `translateX` — callers own that so a tap and a swipe can each drive the
   * animation in the way that suits them (see `onSelectFeedType` and the pan gesture below). */
  const applySelectedFeedType = useCallback((type: FeedType) => {
    setSelectedFeedType(prev => {
      if (prev === type) {
        return prev;
      }
      setQuickViewProduct(null);
      setCommentsProduct(null);
      return type;
    });
  }, []);

  const onSelectFeedType = useCallback(
    (type: FeedType) => {
      if (type === selectedFeedType) {
        return;
      }
      applySelectedFeedType(type);
      translateX.value = withTiming(PAGE_X[type], {
        duration: SLIDE_DURATION,
        easing: SLIDE_EASING,
      });
    },
    [applySelectedFeedType, selectedFeedType, translateX],
  );

  const gestureStartX = useSharedValue(0);

  // Dev-only gesture instrumentation for manual on-device QA. Guarded by `__DEV__` so it
  // never runs (or costs anything) in production builds.
  const logSwipeGestureDetected = useCallback((velocityX: number, nextType: FeedType) => {
    if (__DEV__) {
      console.log(
        `[Gesture][swipe] end velocityX=${velocityX.toFixed(0)} nextFeedType=${nextType}`,
      );
    }
  }, []);

  const feedSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        // Requires a clearly horizontal drag before claiming the gesture; a clearly vertical drag
        // fails fast and hands the touch back to the FlatList's native vertical paging.
        .activeOffsetX([-20, 20])
        .failOffsetY([-20, 20])
        .onStart(() => {
          gestureStartX.value = translateX.value;
        })
        .onUpdate(event => {
          translateX.value = Math.min(
            0,
            Math.max(-SCREEN_WIDTH, gestureStartX.value + event.translationX),
          );
        })
        .onEnd(event => {
          const { velocityX } = event;
          let target = translateX.value < -SCREEN_WIDTH / 2 ? -SCREEN_WIDTH : 0;
          if (velocityX > SWIPE_VELOCITY_THRESHOLD) {
            target = 0;
          } else if (velocityX < -SWIPE_VELOCITY_THRESHOLD) {
            target = -SCREEN_WIDTH;
          }
          translateX.value = withTiming(target, { duration: SLIDE_DURATION, easing: SLIDE_EASING });
          const nextType: FeedType = target === 0 ? 'following' : 'trending';
          runOnJS(logSwipeGestureDetected)(velocityX, nextType);
          runOnJS(applySelectedFeedType)(nextType);
        }),
    [applySelectedFeedType, gestureStartX, translateX, logSwipeGestureDetected],
  );

  useEffect(() => {
    if (!quickViewProduct) {
      return;
    }
    const source = selectedFeedType === 'following' ? followingProducts : trendingProducts;
    const updated = source.find(item => item.id === quickViewProduct.id);
    if (updated) {
      setQuickViewProduct(updated);
    }
  }, [followingProducts, quickViewProduct, selectedFeedType, trendingProducts]);

  const handleQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    requestAnimationFrame(() => {
      quickViewRef.current?.present();
    });
  }, []);

  const handleQuickViewDismiss = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const handleComment = useCallback((product: Product) => {
    setCommentsProduct(product);
    requestAnimationFrame(() => {
      commentsRef.current?.present();
    });
  }, []);

  const handleCommentsDismiss = useCallback(() => {
    setCommentsProduct(null);
  }, []);

  const handleOpenDetail = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { productId: product.id, product });
    },
    [navigation],
  );

  const handleQuickViewChat = useCallback(
    (product: Product) => {
      openProductChatFromListing(product);
    },
    [openProductChatFromListing],
  );

  const handleShare = useCallback(
    (product: Product) => {
      openShare(productToSharePayload(product, 'reel'));
    },
    [openShare],
  );

  const handleOpenSearch = useCallback(() => {
    navigation.getParent()?.navigate('Search');
  }, [navigation]);

  return (
    <ReelPlaybackProvider value={isPlaybackAllowed}>
      <View style={styles.container}>
        <TopHeader
          muted={muted}
          onToggleMute={() => setMuted(prev => !prev)}
          selectedFeedType={selectedFeedType}
          onSelectFeedType={onSelectFeedType}
          onPressSearch={handleOpenSearch}
        />

        <GestureDetector gesture={feedSwipeGesture}>
          <Animated.View style={[styles.pagerRow, pagerStyle]}>
            {FEED_ORDER.map(feedType => (
              <FeedPage
                key={feedType}
                feedType={feedType}
                isSelected={feedType === selectedFeedType}
                muted={muted}
                navigation={navigation}
                onQuickView={handleQuickView}
                onComment={handleComment}
                onOpenDetail={handleOpenDetail}
                onShare={handleShare}
              />
            ))}
          </Animated.View>
        </GestureDetector>

        <ProductQuickViewSheet
          ref={quickViewRef}
          product={quickViewProduct}
          onDismiss={handleQuickViewDismiss}
          onLike={id => dispatch(likeProduct(id))}
          onSave={id => dispatch(saveProduct(id))}
          onComment={handleComment}
          onShare={handleShare}
          onOpenDetail={handleOpenDetail}
          onChat={handleQuickViewChat}
          chatLoading={openingChat}
          navigation={navigation}
        />

        <CommentsBottomSheet
          ref={commentsRef}
          product={commentsProduct}
          onDismiss={handleCommentsDismiss}
        />
      </View>
    </ReelPlaybackProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  page: { height: SCREEN_HEIGHT },
  pagerRow: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * FEED_ORDER.length,
  },
  pageWrapper: { width: SCREEN_WIDTH, height: '100%' },
});
