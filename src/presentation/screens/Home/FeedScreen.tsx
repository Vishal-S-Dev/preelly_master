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
import { useReelPlaybackGate } from '../../hooks/useReelPlaybackGate';
import {
  fetchProductsFromFeed,
  likeProduct,
  saveProduct,
  setActiveIndex,
  togglePause,
} from '../../redux/slices/productSlice';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VIEWABILITY_CONFIG = {
  minimumViewTime: 200,
  itemVisiblePercentThreshold: 80,
};

export const FeedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { openShare } = useShareSheet();
  const isPlaybackAllowed = useReelPlaybackGate();
  const flatListRef = useRef<FlatList<Product>>(null);
  const quickViewRef = useRef<BottomSheetModal>(null);
  const commentsRef = useRef<BottomSheetModal>(null);
  const [muted, setMuted] = useState(false);
  const [selectedFeedType, setSelectedFeedType] = useState<FeedType>('trending');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [commentsProduct, setCommentsProduct] = useState<Product | null>(null);
  const { products, page, hasMore, loading, refreshing, activeIndex } = useAppSelector(
    state => state.product,
  );

  useEffect(() => {
    if (!products.length) {
      dispatch(fetchProductsFromFeed({ page: 1, feedType: selectedFeedType }));
    }
  }, [dispatch, products.length, selectedFeedType]);

  const onSelectFeedType = useCallback(
    (type: FeedType) => {
      if (type === selectedFeedType) {
        return;
      }
      setSelectedFeedType(type);
      setQuickViewProduct(null);
      setCommentsProduct(null);
      dispatch(fetchProductsFromFeed({ page: 1, refresh: true, feedType: type }));
    },
    [dispatch, selectedFeedType],
  );

  useEffect(() => {
    if (!quickViewProduct) {
      return;
    }
    const updated = products.find(item => item.id === quickViewProduct.id);
    if (updated) {
      setQuickViewProduct(updated);
    }
  }, [products, quickViewProduct]);

  const onRefresh = useCallback(() => {
    dispatch(fetchProductsFromFeed({ page: 1, refresh: true, feedType: selectedFeedType }));
  }, [dispatch, selectedFeedType]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchProductsFromFeed({ page: page + 1, feedType: selectedFeedType }));
    }
  }, [dispatch, hasMore, loading, page, selectedFeedType]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems[0];
      if (typeof firstVisible?.index === 'number') {
        dispatch(setActiveIndex(firstVisible.index));
      }
    },
    [dispatch],
  );

  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
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
      navigation.navigate('ProductDetail', { productId: product.id, product });
    },
    [navigation],
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

  const renderItem: ListRenderItem<Product> = useCallback(
    ({ item, index }) => (
      <View style={styles.page}>
        <ReelCard
          product={item}
          isActive={index === activeIndex}
          muted={muted}
          onTogglePause={id => dispatch(togglePause(id))}
          onLike={id => dispatch(likeProduct(id))}
          onSave={id => dispatch(saveProduct(id))}
          onQuickView={handleQuickView}
          onComment={handleComment}
          onOpenDetail={handleOpenDetail}
          onShare={handleShare}
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
      handleComment,
      handleOpenDetail,
      handleShare,
      handleQuickView,
      muted,
      navigation,
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
    <ReelPlaybackProvider value={isPlaybackAllowed}>
      <View style={styles.container}>
        <TopHeader
          muted={muted}
          onToggleMute={() => setMuted(prev => !prev)}
          selectedFeedType={selectedFeedType}
          onSelectFeedType={onSelectFeedType}
          onPressSearch={handleOpenSearch}
        />
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
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.7}
          ListFooterComponent={loading && products.length > 0 ? <Loader /> : null}
        />

        <ProductQuickViewSheet
          ref={quickViewRef}
          product={quickViewProduct}
          onDismiss={handleQuickViewDismiss}
          onLike={id => dispatch(likeProduct(id))}
          onSave={id => dispatch(saveProduct(id))}
          onOpenDetail={handleOpenDetail}
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
});
