import React, { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProfileProductGridItem, ProfileTabKey } from '../../../types/profile.types';
import { ProductGridCard } from './ProductGridCard';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  tab: ProfileTabKey;
  items: ProfileProductGridItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
}

const GridSkeleton = memo(() => {
  const { styles, colors } = useProfileStyles();
  const { width } = useWindowDimensions();
  const cellWidth = (width - colors.gridGap * 2) / 3;
  const cellHeight = cellWidth * 1.38;
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View
          key={`sk_${i}`}
          style={[styles.skeletonCell, { width: cellWidth, height: cellHeight }]}
        />
      ))}
    </View>
  );
});

const EmptyState = memo<{ tab: ProfileTabKey }>(({ tab }) => {
  const { styles, colors } = useProfileStyles();
  const copy =
    tab === 'saved'
      ? { title: 'No saved listings', subtitle: 'Bookmark products to see them here.' }
      : tab === 'liked'
        ? { title: 'No favorites yet', subtitle: 'Like listings to build your favorites grid.' }
        : { title: 'No posts yet', subtitle: 'Post your first ad to fill your profile grid.' };

  return (
    <View style={styles.emptyWrap}>
      <Icon name="package-variant" size={48} color={colors.iconMuted} />
      <Text style={styles.emptyTitle}>{copy.title}</Text>
      <Text style={styles.emptySubtitle}>{copy.subtitle}</Text>
    </View>
  );
});

export const ProductGridFeed = memo<Props>(
  ({ tab, items, loading, refreshing, loadingMore, onRefresh, onLoadMore }) => {
    const { styles, colors } = useProfileStyles();
    const renderItem = useCallback(
      ({ item, index }: { item: ProfileProductGridItem; index: number }) => (
        <ProductGridCard item={item} index={index} />
      ),
      [],
    );

    const keyExtractor = useCallback((item: ProfileProductGridItem) => item.id, []);

    const listEmpty = useMemo(() => {
      if (loading) {
        return <GridSkeleton />;
      }
      return <EmptyState tab={tab} />;
    }, [loading, tab]);

    const footer = useMemo(
      () =>
        loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null,
      [colors.primary, loadingMore, styles.footerLoader],
    );

    return (
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={items.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={footer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    );
  },
);

ProductGridFeed.displayName = 'ProductGridFeed';
