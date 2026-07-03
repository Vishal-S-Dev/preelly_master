const clampMapDimension = (value: number, max = 1280): number =>
  Math.min(Math.max(Math.round(value), 100), max);

/**
 * OpenStreetMap static preview with a pinned marker (road map / street-level zoom).
 * No API key required — suitable for in-card map previews.
 */
export const buildStaticMapPreviewUrl = (
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 16,
): string => {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const size = `${clampMapDimension(width)}x${clampMapDimension(height)}`;

  return (
    `https://staticmap.openstreetmap.de/staticmap.php` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${size}` +
    `&maptype=mapnik` +
    `&markers=${lat},${lng},red-pushpin`
  );
};
