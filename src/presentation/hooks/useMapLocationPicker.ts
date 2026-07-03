import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { MapController, MapCoordinate, MapRegion } from '../../types/mapRegion.types';
import {
  getCurrentGpsCoordinates,
  isGeolocationNativeModuleAvailable,
  LocationServiceError,
} from '../../utils/geolocationService';
import { buildMapRegion, isDefaultListingCoordinates } from '../../utils/mapRegionUtils';
import {
  requestLocationPermission,
  showLocationPermissionAlert,
} from '../../utils/locationPermissions';
import { reverseGeocode } from '../../utils/reverseGeocode';
import { isMapsNativeModuleAvailable } from '../../utils/mapsNativeModule';

interface UseMapLocationPickerOptions {
  latitude: number;
  longitude: number;
  onCoordinateChange: (lat: number, lng: number) => void;
  onLocateYourItemChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

interface UseMapLocationPickerResult {
  region: MapRegion;
  markerCoordinate: MapCoordinate;
  isLocating: boolean;
  isGeocoding: boolean;
  permissionDenied: boolean;
  statusMessage: string | null;
  mapsLinked: boolean;
  handleMapControllerReady: (controller: MapController | null) => void;
  handleMarkerDragEnd: (coordinate: MapCoordinate) => void;
  handleCurrentLocationPress: () => void;
  handleRegionChangeComplete: (nextRegion: MapRegion) => void;
}

const GEOCODE_DEBOUNCE_MS = 450;

export const useMapLocationPicker = ({
  latitude,
  longitude,
  onCoordinateChange,
  onLocateYourItemChange,
  onAddressChange,
}: UseMapLocationPickerOptions): UseMapLocationPickerResult => {
  const mapControllerRef = useRef<MapController | null>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRequestedInitialGpsRef = useRef(false);
  const mapsLinked = isMapsNativeModuleAvailable();
  const geolocationLinked = isGeolocationNativeModuleAvailable();

  const [region, setRegion] = useState<MapRegion>(() => buildMapRegion(latitude, longitude));
  const [markerCoordinate, setMarkerCoordinate] = useState<MapCoordinate>({
    latitude,
    longitude,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleMapControllerReady = useCallback((controller: MapController | null) => {
    mapControllerRef.current = controller;
  }, []);

  const animateToCoordinate = useCallback((nextLatitude: number, nextLongitude: number) => {
    const nextRegion = buildMapRegion(nextLatitude, nextLongitude);
    setRegion(nextRegion);
    setMarkerCoordinate({ latitude: nextLatitude, longitude: nextLongitude });
    mapControllerRef.current?.animateToRegion(nextRegion, 350);
  }, []);

  const applyReverseGeocode = useCallback(
    async (nextLatitude: number, nextLongitude: number) => {
      setIsGeocoding(true);
      setStatusMessage(null);

      const result = await reverseGeocode(nextLatitude, nextLongitude);
      setIsGeocoding(false);

      if (!result) {
        setStatusMessage('Unable to resolve address. You can still adjust the pin manually.');
        return;
      }

      onLocateYourItemChange(result.locateLabel);
      onAddressChange(result.buildingStreet);
    },
    [onAddressChange, onLocateYourItemChange],
  );

  const scheduleReverseGeocode = useCallback(
    (nextLatitude: number, nextLongitude: number) => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      geocodeTimeoutRef.current = setTimeout(() => {
        applyReverseGeocode(nextLatitude, nextLongitude);
      }, GEOCODE_DEBOUNCE_MS);
    },
    [applyReverseGeocode],
  );

  const updateCoordinates = useCallback(
    (nextLatitude: number, nextLongitude: number, options?: { animate?: boolean; geocode?: boolean }) => {
      if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
        return;
      }

      onCoordinateChange(nextLatitude, nextLongitude);

      if (options?.animate !== false) {
        animateToCoordinate(nextLatitude, nextLongitude);
      } else {
        setMarkerCoordinate({ latitude: nextLatitude, longitude: nextLongitude });
        setRegion(buildMapRegion(nextLatitude, nextLongitude));
      }

      if (options?.geocode !== false) {
        scheduleReverseGeocode(nextLatitude, nextLongitude);
      }
    },
    [animateToCoordinate, onCoordinateChange, scheduleReverseGeocode],
  );

  const resolveCurrentLocation = useCallback(
    async (options?: { showAlerts?: boolean; geocode?: boolean }) => {
      setIsLocating(true);
      setStatusMessage(null);

      try {
        if (!geolocationLinked) {
          setStatusMessage(
            'Location services are not loaded. Rebuild the app, then use the pin or current-location button.',
          );
          return;
        }

        const permission = await requestLocationPermission();
        if (permission !== 'granted') {
          setPermissionDenied(true);
          setIsLocating(false);
          if (options?.showAlerts) {
            showLocationPermissionAlert(permission === 'blocked' ? 'blocked' : 'denied');
          }
          return;
        }

        setPermissionDenied(false);
        const position = await getCurrentGpsCoordinates();
        updateCoordinates(position.latitude, position.longitude, {
          animate: true,
          geocode: options?.geocode !== false,
        });
      } catch (error) {
        const message =
          error instanceof LocationServiceError
            ? error.message
            : 'Unable to fetch your current location.';
        setStatusMessage(message);
        if (options?.showAlerts) {
          Alert.alert('Location unavailable', message);
        }
      } finally {
        setIsLocating(false);
      }
    },
    [geolocationLinked, updateCoordinates],
  );

  useEffect(() => {
    const latitudeChanged = Math.abs(latitude - markerCoordinate.latitude) > 0.000001;
    const longitudeChanged = Math.abs(longitude - markerCoordinate.longitude) > 0.000001;
    if (!latitudeChanged && !longitudeChanged) {
      return;
    }

    setMarkerCoordinate({ latitude, longitude });
    setRegion(buildMapRegion(latitude, longitude));
  }, [latitude, longitude, markerCoordinate.latitude, markerCoordinate.longitude]);

  useEffect(() => {
    if (hasRequestedInitialGpsRef.current) {
      return;
    }
    hasRequestedInitialGpsRef.current = true;

    if (isDefaultListingCoordinates(latitude, longitude)) {
      if (geolocationLinked) {
        resolveCurrentLocation({ showAlerts: false, geocode: true });
      }
    }
  }, [geolocationLinked, latitude, longitude, resolveCurrentLocation]);

  useEffect(
    () => () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    },
    [],
  );

  const handleMarkerDragEnd = useCallback(
    (coordinate: MapCoordinate) => {
      updateCoordinates(coordinate.latitude, coordinate.longitude, {
        animate: false,
        geocode: true,
      });
    },
    [updateCoordinates],
  );

  const handleCurrentLocationPress = useCallback(() => {
    resolveCurrentLocation({ showAlerts: true, geocode: true });
  }, [resolveCurrentLocation]);

  const handleRegionChangeComplete = useCallback((nextRegion: MapRegion) => {
    setRegion(nextRegion);
  }, []);

  return {
    region,
    markerCoordinate,
    isLocating,
    isGeocoding,
    permissionDenied,
    statusMessage,
    mapsLinked,
    handleMapControllerReady,
    handleMarkerDragEnd,
    handleCurrentLocationPress,
    handleRegionChangeComplete,
  };
};
