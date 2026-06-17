import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShimmerBox } from './ShimmerBox';
import { SEARCH_CARD_HEIGHT, SEARCH_CARD_WIDTH } from '../search/searchStyles';

export const HorizontalVideoListingSkeleton = memo(() => (
  <View style={styles.section}>
    <ShimmerBox style={styles.title} borderRadius={8} />
    <View style={styles.row}>
      {Array.from({ length: 3 }).map((_, index) => (
        <ShimmerBox key={index} style={styles.card} borderRadius={18} />
      ))}
    </View>
  </View>
));

HorizontalVideoListingSkeleton.displayName = 'HorizontalVideoListingSkeleton';

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    width: 160,
    height: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    width: SEARCH_CARD_WIDTH,
    height: SEARCH_CARD_HEIGHT,
  },
});
