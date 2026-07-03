import { MapRegion } from '../types/mapRegion.types';

export const DEFAULT_MAP_REGION_DELTA = {
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

export const buildMapRegion = (
  latitude: number,
  longitude: number,
  latitudeDelta = DEFAULT_MAP_REGION_DELTA.latitudeDelta,
  longitudeDelta = DEFAULT_MAP_REGION_DELTA.longitudeDelta,
): MapRegion => ({
  latitude,
  longitude,
  latitudeDelta,
  longitudeDelta,
});

export const isDefaultListingCoordinates = (latitude: number, longitude: number): boolean =>
  Math.abs(latitude - 24.4539) < 0.0001 && Math.abs(longitude - 54.3773) < 0.0001;
