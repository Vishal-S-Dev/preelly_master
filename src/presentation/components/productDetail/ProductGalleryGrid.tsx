import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { buildProductGalleryRows } from './productGalleryLayout';

interface Props {
  images: string[];
  onPressImage: (index: number) => void;
}

export const ProductGalleryGrid = memo<Props>(({ images, onPressImage }) => {
  const rows = useMemo(() => buildProductGalleryRows(images), [images]);

  if (!images.length) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => {
        if (row.type === 'single') {
          return (
            <View
              key={`single-${row.index}`}
              style={[styles.row, rowIndex > 0 ? styles.rowSpaced : null]}
            >
              <Pressable
                style={styles.tileSingle}
                onPress={() => onPressImage(row.index)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${row.index + 1} of ${images.length}`}
              >
                <Image source={{ uri: row.uri }} style={styles.imageSingle} resizeMode="cover" />
              </Pressable>
            </View>
          );
        }

        return (
          <View
            key={`pair-${row.indices.join('-')}`}
            style={[styles.row, styles.pairRow, rowIndex > 0 ? styles.rowSpaced : null]}
          >
            {row.uris.map((uri, pairIndex) => (
              <Pressable
                key={`${uri}-${row.indices[pairIndex]}`}
                style={styles.tileHalf}
                onPress={() => onPressImage(row.indices[pairIndex])}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${row.indices[pairIndex] + 1} of ${images.length}`}
              >
                <Image source={{ uri }} style={styles.imageHalf} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        );
      })}
    </View>
  );
});

ProductGalleryGrid.displayName = 'ProductGalleryGrid';

const styles = StyleSheet.create({
  grid: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    width: '100%',
  },
  rowSpaced: {
    marginTop: 1,
  },
  pairRow: {
    flexDirection: 'row',
    gap: 1,
  },
  tileSingle: {
    width: '100%',
    backgroundColor: '#E5E7EB',
  },
  tileHalf: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  imageSingle: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  imageHalf: {
    width: '100%',
    aspectRatio: 1,
  },
});
