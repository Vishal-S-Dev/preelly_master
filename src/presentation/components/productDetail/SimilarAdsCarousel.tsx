import React, { memo, useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SimilarAdItem } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';
import { SimilarAdCard } from './SimilarAdCard';

interface Props {
  items: SimilarAdItem[];
  onPressItem?: (id: string) => void;
}

export const SimilarAdsCarousel = memo<Props>(({ items, onPressItem }) => {
  const renderItem = useCallback(
    ({ item }: { item: SimilarAdItem }) => (
      <SimilarAdCard item={item} onPress={onPressItem} />
    ),
    [onPressItem],
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
      />
    </View>
  );
});

SimilarAdsCarousel.displayName = 'SimilarAdsCarousel';
