import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShimmerBox } from '../skeletons/ShimmerBox';

export const CategoryFilterSkeleton = memo(() => (
  <View style={styles.container}>
    <View style={styles.header}>
      <ShimmerBox style={styles.back} borderRadius={20} />
      <ShimmerBox style={styles.title} borderRadius={8} />
    </View>
    <ShimmerBox style={styles.search} borderRadius={14} />
    <ShimmerBox style={styles.sectionTitle} borderRadius={6} />
    <View style={styles.chipRow}>
      {Array.from({ length: 9 }).map((_, index) => (
        <ShimmerBox key={index} style={styles.chip} borderRadius={999} />
      ))}
    </View>
    <ShimmerBox style={styles.sectionTitle} borderRadius={6} />
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <ShimmerBox key={index} style={styles.gridCard} borderRadius={16} />
      ))}
    </View>
    <ShimmerBox style={styles.sectionTitle} borderRadius={6} />
    <View style={styles.chipRow}>
      {Array.from({ length: 4 }).map((_, index) => (
        <ShimmerBox key={index} style={styles.chip} borderRadius={999} />
      ))}
    </View>
    <ShimmerBox style={styles.dropdown} borderRadius={12} />
    <ShimmerBox style={styles.dropdown} borderRadius={12} />
    <ShimmerBox style={styles.slider} borderRadius={8} />
    <View style={styles.footer}>
      <ShimmerBox style={styles.footerBtn} borderRadius={12} />
      <ShimmerBox style={styles.footerBtn} borderRadius={12} />
    </View>
  </View>
));

CategoryFilterSkeleton.displayName = 'CategoryFilterSkeleton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  back: { width: 40, height: 40 },
  title: { width: 160, height: 20, marginLeft: 40 },
  search: {
    height: 48,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    width: 120,
    height: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 8,
  },
  chip: { width: 88, height: 34 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 18,
  },
  gridCard: { width: '31%', height: 104 },
  dropdown: {
    height: 48,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  slider: {
    height: 80,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerBtn: { flex: 1, height: 48 },
});
