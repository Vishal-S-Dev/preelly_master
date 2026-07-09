import { LocationDTO } from '../../../../../data/api/UserApi';
import { UserLocation } from '../../../../../types/profileEdit.types';

const UAE_LAT_MIN = 22;
const UAE_LAT_MAX = 27;
const UAE_LNG_MIN = 50;
const UAE_LNG_MAX = 57;

const isUaeLatitude = (value: number) => value >= UAE_LAT_MIN && value <= UAE_LAT_MAX;
const isUaeLongitude = (value: number) => value >= UAE_LNG_MIN && value <= UAE_LNG_MAX;

const normalizePair = (first: number, second: number): [number, number] | null => {
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }

  if (isUaeLatitude(first) && isUaeLongitude(second)) {
    return [first, second];
  }

  if (isUaeLatitude(second) && isUaeLongitude(first)) {
    return [second, first];
  }

  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return [first, second];
  }

  if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
    return [second, first];
  }

  return null;
};

export const extractLocationCoordinates = (
  dto: LocationDTO,
): { latitude: number; longitude: number } | null => {
  if (Array.isArray(dto.coordinates)) {
    const normalized = normalizePair(dto.coordinates[0], dto.coordinates[1]);
    if (normalized) {
      return { latitude: normalized[0], longitude: normalized[1] };
    }
  }

  const geoCoordinates = dto.coordinates;
  if (geoCoordinates && !Array.isArray(geoCoordinates)) {
    const nested = geoCoordinates.coordinates;
    if (Array.isArray(nested)) {
      const normalized = normalizePair(nested[0], nested[1]);
      if (normalized) {
        return { latitude: normalized[0], longitude: normalized[1] };
      }
    }
  }

  return null;
};

export const mapLocationDto = (dto: LocationDTO, index: number): UserLocation => {
  const id = dto._id ?? dto.id ?? `loc_${index}`;
  const coordinates = extractLocationCoordinates(dto);
  const detailLocation = dto.detailLocation?.trim();
  const parts = [dto.building, dto.apartment, dto.city].filter(Boolean);

  return {
    id,
    label: dto.label ?? 'Home',
    city: dto.city,
    building: dto.building,
    apartment: dto.apartment,
    detailLocation,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    fullAddress: detailLocation || (parts.length ? parts.join(', ') : 'Address not set'),
    isDefault: Boolean(dto.isDefault),
  };
};

export const DEFAULT_ADDRESS_COORDINATES = {
  latitude: 25.2048,
  longitude: 55.2708,
};
