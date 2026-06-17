import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryGridSkeleton } from './CategoryGridSkeleton';
import { HorizontalVideoListingSkeleton } from './HorizontalVideoListingSkeleton';
import { SearchBarSkeleton } from './TrendingSkeleton';
import { ShimmerBox } from './ShimmerBox';
import { TrendingSkeleton } from './TrendingSkeleton';

export const SearchSkeleton = memo(() => (
  <View style={styles.container}>
    <View style={styles.header}>
      <ShimmerBox style={styles.back} borderRadius={20} />
      <ShimmerBox style={styles.headerTitle} borderRadius={8} />
    </View>
    <SearchBarSkeleton />
    <View style={styles.chips}>
      {Array.from({ length: 9 }).map((_, index) => (
        <ShimmerBox key={index} style={styles.chip} borderRadius={999} />
      ))}
    </View>
    <ShimmerBox style={styles.sectionTitle} borderRadius={8} />
    <TrendingSkeleton />
    <ShimmerBox style={styles.sectionTitleSpaced} borderRadius={8} />
    <CategoryGridSkeleton />
    <HorizontalVideoListingSkeleton />
    <HorizontalVideoListingSkeleton />
    {Array.from({ length: 3 }).map((_, index) => (
      <ShimmerBox key={index} style={styles.accordionRow} borderRadius={14} />
    ))}
  </View>
));

SearchSkeleton.displayName = 'SearchSkeleton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    width: 140,
    height: 20,
    marginLeft: 40,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  chip: {
    width: 88,
    height: 34,
    marginRight: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    width: 120,
    height: 18,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    width: 120,
    height: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  accordionRow: {
    height: 52,
    marginHorizontal: 16,
    marginBottom: 10,
  },
});
