import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShimmerBox } from './ShimmerBox';

export const SearchBarSkeleton = memo(() => (
  <View style={styles.wrap}>
    <ShimmerBox style={styles.bar} borderRadius={14} />
  </View>
));

SearchBarSkeleton.displayName = 'SearchBarSkeleton';

export const TrendingSkeleton = memo(() => (
  <View style={styles.trendingWrap}>
    {Array.from({ length: 8 }).map((_, index) => (
      <ShimmerBox key={index} style={styles.trendChip} borderRadius={999} />
    ))}
  </View>
));

TrendingSkeleton.displayName = 'TrendingSkeleton';

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  bar: {
    height: 48,
    width: '100%',
  },
  trendingWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  trendChip: {
    width: 96,
    height: 34,
    marginRight: 8,
    marginBottom: 8,
  },
});
