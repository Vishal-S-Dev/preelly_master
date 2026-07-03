export type ProductGalleryRow =
  | { type: 'single'; uri: string; index: number }
  | { type: 'pair'; uris: string[]; indices: number[] };

/** Alternating 1 full-width + 2 half-width row layout (matches product gallery design). */
export const buildProductGalleryRows = (images: string[]): ProductGalleryRow[] => {
  const rows: ProductGalleryRow[] = [];
  let index = 0;

  while (index < images.length) {
    if (index % 3 === 0) {
      rows.push({ type: 'single', uri: images[index], index });
      index += 1;
      continue;
    }

    const pair = images.slice(index, index + 2);
    rows.push({
      type: 'pair',
      uris: pair,
      indices: pair.map((_, offset) => index + offset),
    });
    index += pair.length;
  }

  return rows;
};
