import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ShimmerBox } from '../skeletons/ShimmerBox';
import {
  SEARCH_RESULT_GRID_GAP,
  SEARCH_RESULT_GRID_PADDING,
} from './SearchResultCard';

export const SearchFilterSkeleton = memo(() => {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(
    () => (width - SEARCH_RESULT_GRID_PADDING * 2 - SEARCH_RESULT_GRID_GAP) / 2,
    [width],
  );
  const cardHeight = useMemo(() => cardWidth * 1.38, [cardWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ShimmerBox style={styles.backBtn} borderRadius={20} />
        <ShimmerBox style={styles.pill} borderRadius={20} />
        <ShimmerBox style={styles.pill} borderRadius={20} />
        <ShimmerBox style={styles.searchBtn} borderRadius={20} />
      </View>

      <View style={styles.chipRow}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ShimmerBox key={index} style={styles.chip} borderRadius={20} />
        ))}
      </View>

      <View style={styles.countBlock}>
        <ShimmerBox style={styles.countTitle} borderRadius={6} />
        <ShimmerBox style={styles.countSubtitle} borderRadius={6} />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ShimmerBox
            key={index}
            style={{ width: cardWidth, height: cardHeight, marginBottom: SEARCH_RESULT_GRID_GAP }}
            borderRadius={16}
          />
        ))}
      </View>
    </View>
  );
});

SearchFilterSkeleton.displayName = 'SearchFilterSkeleton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
  },
  pill: {
    width: 72,
    height: 38,
  },
  searchBtn: {
    width: 40,
    height: 40,
    marginLeft: 'auto',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    width: 78,
    height: 34,
  },
  countBlock: {
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  countTitle: {
    width: '72%',
    height: 16,
  },
  countSubtitle: {
    width: 90,
    height: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SEARCH_RESULT_GRID_PADDING,
  },
});
