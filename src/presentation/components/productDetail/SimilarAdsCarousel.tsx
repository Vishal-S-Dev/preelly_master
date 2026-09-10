import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View, ViewToken } from 'react-native';
import { SimilarAdItem } from '../../../types/product.types';
import { useAppForeground } from '../../hooks/useAppForeground';
import { pdStyles } from './productDetailStyles';
import { SimilarAdCard } from './SimilarAdCard';

interface Props {
  items: SimilarAdItem[];
  onPressItem?: (id: string) => void;
}

// Horizontal carousel of small cards — one or two are ever fully visible at once, so a lower
// visibility bar (vs. a full-screen feed) still reliably distinguishes "on screen" from "just
// peeking at the edge" without needing a large concurrent-preview cap.
const VIDEO_PREVIEW_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 200,
};

export const SimilarAdsCarousel = memo<Props>(({ items, onPressItem }) => {
  // AppState-only gate (not the combined screen-focus + foreground gate other reel surfaces use)
  // — this component is shared between a plain screen (ProductDetailScreen) and content inside a
  // BottomSheetModal (ProductQuickViewBody). Gorhom's modal content renders through a portal
  // mounted above NavigationContainer in the tree, so `useIsFocused`/`useNavigation` (which the
  // combined gate depends on) throw there with "Couldn't find a navigation object".
  const isPlaybackAllowed = useAppForeground();
  const [visibleVideoIds, setVisibleVideoIds] = useState<ReadonlySet<string>>(() => new Set());
  const lastVisibleIdsKeyRef = useRef('');

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems
        .filter(v => v.isViewable && (v.item as SimilarAdItem | undefined)?.videoUrl)
        .map(v => (v.item as SimilarAdItem).id);

      const key = ids.slice().sort().join(',');
      if (key === lastVisibleIdsKeyRef.current) {
        return;
      }
      lastVisibleIdsKeyRef.current = key;
      setVisibleVideoIds(new Set(ids));
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: VIDEO_PREVIEW_VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
  );

  const renderItem = useCallback(
    ({ item }: { item: SimilarAdItem }) => (
      <SimilarAdCard
        item={item}
        onPress={onPressItem}
        isVisible={isPlaybackAllowed && visibleVideoIds.has(item.id)}
      />
    ),
    [isPlaybackAllowed, onPressItem, visibleVideoIds],
  );

  if (!items.length) {
    return null;
  }

  return (
    <View>
      <Text style={pdStyles.sectionTitle}>Similar ads</Text>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingRight: 4 }}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      />
    </View>
  );
});

SimilarAdsCarousel.displayName = 'SimilarAdsCarousel';
