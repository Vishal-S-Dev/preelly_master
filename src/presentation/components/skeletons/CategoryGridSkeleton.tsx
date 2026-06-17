import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShimmerBox } from './ShimmerBox';

export const CategoryGridSkeleton = memo(() => (
  <View style={styles.grid}>
    {Array.from({ length: 6 }).map((_, index) => (
      <ShimmerBox key={index} style={styles.card} borderRadius={16} />
    ))}
  </View>
));

CategoryGridSkeleton.displayName = 'CategoryGridSkeleton';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: '31%',
    height: 104,
  },
});
