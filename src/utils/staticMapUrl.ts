import Config from 'react-native-config';

const clampMapDimension = (value: number, max = 1280): number =>
  Math.min(Math.max(Math.round(value), 100), max);

const readGoogleMapsApiKey = (): string | null => {
  const fromConfig = Config.GOOGLE_MAPS_API_KEY;
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }
  return null;
};

/**
 * Production static map preview URL.
 * Prefer Google Static Maps (Maps Static API). OSM staticmap.openstreetmap.de
 * returns 403 and was causing empty / broken preview cards.
 */
export const buildStaticMapPreviewUrl = (
  latitude: number,
  longitude: number,
  width = 640,
  height = 320,
  zoom = 16,
): string => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const safeLat = Number.isFinite(lat) ? lat : 25.2048;
  const safeLng = Number.isFinite(lng) ? lng : 55.2708;
  const w = clampMapDimension(width);
  const h = clampMapDimension(height);
  const z = Math.min(Math.max(Math.round(zoom), 1), 20);
  const apiKey = readGoogleMapsApiKey();

  if (apiKey) {
    const size = `${w}x${h}`;
    const marker = `color:0x2563EB%7C${safeLat.toFixed(6)},${safeLng.toFixed(6)}`;
    return (
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${safeLat.toFixed(6)},${safeLng.toFixed(6)}` +
      `&zoom=${z}` +
      `&size=${size}` +
      `&scale=2` +
      `&maptype=roadmap` +
      `&markers=${marker}` +
      `&key=${encodeURIComponent(apiKey)}`
    );
  }

  // Key-free fallback (less reliable than Google; used only when env key is missing).
  const size = `${w}x${h}`;
  return (
    `https://staticmap.openstreetmap.fr/staticmap.php` +
    `?center=${safeLat.toFixed(6)},${safeLng.toFixed(6)}` +
    `&zoom=${z}` +
    `&size=${size}` +
    `&maptype=mapnik` +
    `&markers=${safeLat.toFixed(6)},${safeLng.toFixed(6)},lightblue1`
  );
};
