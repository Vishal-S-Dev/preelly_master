import { NativeModules } from 'react-native';

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export class LocationServiceError extends Error {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN' | 'NOT_LINKED';

  constructor(code: LocationServiceError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

type GeolocationModule = typeof import('@react-native-community/geolocation').default;

let cachedGeolocation: GeolocationModule | null | undefined;

/** True when the native geolocation binary is linked (requires a full native rebuild). */
export const isGeolocationNativeModuleAvailable = (): boolean =>
  Boolean(NativeModules.RNCGeolocation);

const getGeolocationModule = (): GeolocationModule | null => {
  if (cachedGeolocation !== undefined) {
    return cachedGeolocation;
  }

  if (!isGeolocationNativeModuleAvailable()) {
    cachedGeolocation = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedGeolocation = require('@react-native-community/geolocation').default as GeolocationModule;
  } catch {
    cachedGeolocation = null;
  }

  return cachedGeolocation;
};

const mapGeolocationError = (error: { code?: number; message?: string }): LocationServiceError => {
  switch (error.code) {
    case 1:
      return new LocationServiceError('PERMISSION_DENIED', error.message ?? 'Location permission denied.');
    case 2:
      return new LocationServiceError(
        'POSITION_UNAVAILABLE',
        error.message ?? 'Location is unavailable. Check that GPS is enabled.',
      );
    case 3:
      return new LocationServiceError('TIMEOUT', error.message ?? 'Unable to fetch your location in time.');
    default:
      return new LocationServiceError('UNKNOWN', error.message ?? 'Unable to fetch your location.');
  }
};

/** Fetch the device GPS position with high accuracy. */
export const getCurrentGpsCoordinates = (): Promise<GpsCoordinates> => {
  const Geolocation = getGeolocationModule();
  if (!Geolocation) {
    return Promise.reject(
      new LocationServiceError(
        'NOT_LINKED',
        'Location services are not available. Rebuild the app after installing native dependencies.',
      ),
    );
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(mapGeolocationError(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  });
};
