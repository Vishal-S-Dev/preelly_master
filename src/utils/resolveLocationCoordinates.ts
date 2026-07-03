export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

const UAE_CITY_COORDINATES: Record<string, LocationCoordinates> = {
  dubai: { latitude: 25.2048, longitude: 55.2708 },
  'abu dhabi': { latitude: 24.4539, longitude: 54.3773 },
  sharjah: { latitude: 25.3373, longitude: 55.412 },
  ajman: { latitude: 25.4052, longitude: 55.5136 },
  'ras al khaimah': { latitude: 25.7895, longitude: 55.9432 },
  fujairah: { latitude: 25.1288, longitude: 56.3265 },
  'umm al quwain': { latitude: 25.5647, longitude: 55.5552 },
  'al ain': { latitude: 24.2075, longitude: 55.7447 },
  mussafah: { latitude: 24.3327, longitude: 54.5228 },
};

const DEFAULT_COORDINATES: LocationCoordinates = UAE_CITY_COORDINATES['abu dhabi'];

const isValidCoordinate = (value?: number | null): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 180;

export const resolveLocationCoordinates = (options: {
  latitude?: number | null;
  longitude?: number | null;
  locationHint?: string;
}): LocationCoordinates => {
  const { latitude, longitude, locationHint = '' } = options;

  if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
    return { latitude, longitude };
  }

  const normalizedHint = locationHint.toLowerCase();

  for (const [place, coordinates] of Object.entries(UAE_CITY_COORDINATES)) {
    if (normalizedHint.includes(place)) {
      return coordinates;
    }
  }

  return DEFAULT_COORDINATES;
};

const toCoordinate = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/** Read coordinates from product API payloads when available. */
export const extractProductLocationCoordinates = (
  source: Record<string, unknown> | undefined,
): Partial<LocationCoordinates> => {
  if (!source) {
    return {};
  }

  const latitude =
    toCoordinate(source.latitude) ??
    toCoordinate(source.locationLatitude) ??
    toCoordinate(source.lat);
  const longitude =
    toCoordinate(source.longitude) ??
    toCoordinate(source.locationLongitude) ??
    toCoordinate(source.lng) ??
    toCoordinate(source.lon);

  return {
    latitude: isValidCoordinate(latitude) ? latitude : undefined,
    longitude: isValidCoordinate(longitude) ? longitude : undefined,
  };
};
