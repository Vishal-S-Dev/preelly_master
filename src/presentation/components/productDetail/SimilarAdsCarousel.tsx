import React, { memo, useCallback } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SimilarAdItem } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

interface Props {
  items: SimilarAdItem[];
  onPressItem?: (id: string) => void;
}

export const SimilarAdsCarousel = memo<Props>(({ items, onPressItem }) => {
  const renderItem = useCallback(
    ({ item }: { item: SimilarAdItem }) => (
      <Pressable style={pdStyles.similarCard} onPress={() => onPressItem?.(item.id)}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 120 }} />
        <View style={{ padding: 10 }}>
          <Text style={{ fontWeight: '700', color: '#111827' }} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: '#2563EB', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              {item.year}
            </Text>
            <Text style={{ fontSize: 11, color: '#2563EB', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              {item.mileage}
            </Text>
          </View>
          <Text style={{ marginTop: 8, color: '#0026FF', fontWeight: '800' }}>
            {item.currency} {item.price.toLocaleString()}
          </Text>
          <Text style={{ marginTop: 4, color: '#9CA3AF', fontSize: 11 }}>
            {item.location} · {item.postedAgo}
          </Text>
        </View>
      </Pressable>
    ),
    [onPressItem],
  );

  return (
    <View>
      <Text style={pdStyles.sectionTitle}>Similar ads</Text>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
    </View>
  );
});

SimilarAdsCarousel.displayName = 'SimilarAdsCarousel';
