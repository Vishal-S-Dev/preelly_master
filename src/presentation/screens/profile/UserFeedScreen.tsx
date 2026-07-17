import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product } from '../../../domain/models/Product';
import { Loader } from '../../components/common/Loader';
import { CommentsBottomSheet } from '../../components/comments/CommentsBottomSheet';
import { ProductQuickViewSheet } from '../../components/productQuickView/ProductQuickViewSheet';
import {
  OwnerListingMenuAction,
  OwnerListingMenuSheet,
} from '../../components/reel/OwnerListingMenuSheet';
import { ReelCard } from '../../components/ReelCard';
import { ReelPlaybackProvider } from '../../context/ReelPlaybackContext';
import { useShareSheet } from '../../context/ShareSheetContext';
import { productToSharePayload } from '../../../utils/shareLinks';
import { useAppDispatch } from '../../hooks/useRedux';
import { useProductChatInit } from '../../hooks/useProductChatInit';
import { useReelPlaybackGate } from '../../hooks/useReelPlaybackGate';
import { useUserFeedData } from '../../hooks/useUserFeedData';
import { RootStackParamList } from '../../navigation/types';
import { likeProduct, saveProduct } from '../../redux/slices/productSlice';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 200,
  itemVisiblePercentThreshold: 80,
};

type UserFeedRoute = RouteProp<RootStackParamList, 'UserFeed'>;

export const UserFeedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<UserFeedRoute>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { openShare } = useShareSheet();
  const { openProductChatFromListing, openingChat } = useProductChatInit();
  const isPlaybackAllowed = useReelPlaybackGate();

  const {
    userId,
    initialProductId,
    initialIndex,
    seedProducts,
    listingSource = 'posts',
    ownerMode = false,
  } = route.params;

  const {
    products,
    loading,
    loadingMore,
    error,
    activeIndex,
    setActiveIndex,
    initialScrollIndex,
    onLoadMore,
    togglePause,
    applyLikeResult,
    applySaveResult,
    applyViewedResult,
  } = useUserFeedData({
    userId,
    initialProductId,
    initialIndex,
    seedProducts,
    listingSource,
  });

  const flatListRef = useRef<FlatList<Product>>(null);
  const quickViewRef = useRef<BottomSheetModal>(null);
  const commentsRef = useRef<BottomSheetModal>(null);
  const ownerMenuRef = useRef<BottomSheetModal>(null);
  const [muted, setMuted] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [commentsProduct, setCommentsProduct] = useState<Product | null>(null);
  const [ownerMenuProduct, setOwnerMenuProduct] = useState<Product | null>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems[0];
      if (typeof firstVisible?.index === 'number') {
        setActiveIndex(firstVisible.index);
      }
    },
    [setActiveIndex],
  );

  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
  );

  const handleLike = useCallback(
    (productId: string) => {
      const current = products.find(item => item.id === productId);
      if (!current) {
        return;
      }
      const nextLiked = !current.liked;
      const nextCount = Math.max(0, current.likesCount + (nextLiked ? 1 : -1));
      applyLikeResult(productId, nextLiked, nextCount);
      dispatch(likeProduct(productId));
    },
    [applyLikeResult, dispatch, products],
  );

  const handleSave = useCallback(
    (productId: string) => {
      const current = products.find(item => item.id === productId);
      if (!current) {
        return;
      }
      applySaveResult(productId, !current.isSaved);
      dispatch(saveProduct(productId));
    },
    [applySaveResult, dispatch, products],
  );

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
      if (ownerMode) {
        navigation.navigate('EditProduct', { productId: product.id, product });
        return;
      }
      navigation.navigate('ProductDetail', { productId: product.id, product });
    },
    [navigation, ownerMode],
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

  const handleOwnerMenu = useCallback((product: Product) => {
    setOwnerMenuProduct(product);
    requestAnimationFrame(() => {
      ownerMenuRef.current?.present();
    });
  }, []);

  const handleOwnerMenuDismiss = useCallback(() => {
    setOwnerMenuProduct(null);
  }, []);

  const handleOwnerMenuAction = useCallback(
    (action: OwnerListingMenuAction, product: Product) => {
      if (action === 'delete') {
        Alert.alert(
          'Delete this Ad',
          'Are you sure you want to delete this listing? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => undefined,
            },
          ],
        );
        return;
      }

      if (action === 'edit') {
        navigation.navigate('EditProduct', { productId: product.id, product });
        return;
      }

      const labels: Record<string, string> = {
        warehouse: 'Move to Warehouse',
        insight: 'See Insight',
        boost: 'Boost this Ad',
        sold: 'Mark as sold',
        unpublish: 'Unpublish this',
      };

      Alert.alert(
        labels[action] ?? 'Listing action',
        'This action will be available in a future update.',
      );
    },
    [navigation],
  );

  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    flatListRef.current?.scrollToOffset({
      offset: info.index * SCREEN_HEIGHT,
      animated: false,
    });
  }, []);

  const renderItem: ListRenderItem<Product> = useCallback(
    ({ item, index }) => (
      <View style={styles.page}>
        <ReelCard
          product={item}
          isActive={index === activeIndex}
          muted={muted}
          fullscreenVideo
          ownerMode={ownerMode}
          onTogglePause={togglePause}
          onLike={handleLike}
          onSave={handleSave}
          onQuickView={handleQuickView}
          onComment={handleComment}
          onOpenDetail={handleOpenDetail}
          onShare={handleShare}
          onProductViewed={applyViewedResult}
          onOwnerMenu={ownerMode ? handleOwnerMenu : undefined}
          onOpenProfile={profileUserId => {
            if (profileUserId && profileUserId !== userId) {
              navigation.navigate('OtherProfile', { userId: profileUserId });
            }
          }}
        />
      </View>
    ),
    [
      activeIndex,
      handleComment,
      handleLike,
      handleOpenDetail,
      handleOwnerMenu,
      handleShare,
      handleQuickView,
      handleSave,
      applyViewedResult,
      muted,
      navigation,
      ownerMode,
      togglePause,
      userId,
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

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No reels available</Text>
        {error ? <Text style={styles.emptySubtitle}>{error}</Text> : null}
      </View>
    );
  }, [error, loading]);

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Loader />
      </View>
    );
  }

  return (
    <ReelPlaybackProvider value={isPlaybackAllowed}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={10}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setMuted(prev => !prev)} style={styles.headerBtn} hitSlop={10}>
            <Icon name={muted ? 'volume-off' : 'volume-high'} size={22} color="#fff" />
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          initialScrollIndex={
            products.length > 0 ? Math.min(initialScrollIndex, products.length - 1) : undefined
          }
          windowSize={3}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.7}
          onScrollToIndexFailed={onScrollToIndexFailed}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={loadingMore && products.length > 0 ? <Loader /> : null}
          showsVerticalScrollIndicator={false}
        />

        <ProductQuickViewSheet
          ref={quickViewRef}
          product={quickViewProduct}
          onDismiss={handleQuickViewDismiss}
          onLike={handleLike}
          onSave={handleSave}
          onOpenDetail={handleOpenDetail}
          onChat={ownerMode ? undefined : handleQuickViewChat}
          chatLoading={openingChat}
        />

        <CommentsBottomSheet
          ref={commentsRef}
          product={commentsProduct}
          onDismiss={handleCommentsDismiss}
        />

        {ownerMode ? (
          <OwnerListingMenuSheet
            ref={ownerMenuRef}
            product={ownerMenuProduct}
            onDismiss={handleOwnerMenuDismiss}
            onAction={handleOwnerMenuAction}
          />
        ) : null}
      </View>
    </ReelPlaybackProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  page: { height: SCREEN_HEIGHT },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
