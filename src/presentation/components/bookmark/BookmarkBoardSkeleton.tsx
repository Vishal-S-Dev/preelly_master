import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ShimmerBox } from '../skeletons/ShimmerBox';

const HORIZONTAL_PADDING = 16;
const GAP = 12;

export const BookmarkBoardSkeleton = memo(() => {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(
    () => (width - HORIZONTAL_PADDING * 2 - GAP) / 2,
    [width],
  );
  const collageHeight = cardWidth * 0.92;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ShimmerBox style={styles.searchBar} borderRadius={26} />
        <ShimmerBox style={styles.addBtn} borderRadius={22} />
      </View>

      <View style={styles.chipRow}>
        <ShimmerBox style={styles.chip} borderRadius={20} />
        <ShimmerBox style={styles.chipMedium} borderRadius={20} />
        <ShimmerBox style={styles.chipWide} borderRadius={20} />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={{ width: cardWidth, marginBottom: 24 }}>
            <ShimmerBox style={{ width: cardWidth, height: collageHeight }} borderRadius={16} />
            <ShimmerBox style={styles.titleLine} borderRadius={6} />
            <ShimmerBox style={styles.metaLine} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );
});

BookmarkBoardSkeleton.displayName = 'BookmarkBoardSkeleton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 52,
  },
  addBtn: {
    width: 44,
    height: 44,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    width: 70,
    height: 36,
  },
  chipMedium: {
    width: 90,
    height: 36,
  },
  chipWide: {
    width: 100,
    height: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  titleLine: {
    height: 14,
    width: '70%',
    marginTop: 10,
  },
  metaLine: {
    height: 12,
    width: '45%',
    marginTop: 6,
  },
});
