import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MapController, MapCoordinate, MapRegion } from '../../../types/mapRegion.types';
import { buildStaticMapPreviewUrl } from '../../../utils/staticMapUrl';
import { getMapsNativeModule, isMapsNativeModuleAvailable } from '../../../utils/mapsNativeModule';
import { AppTheme } from '../../theme/colors';
import { getLocationMapPickerStyles } from './locationMapPickerStyles';

interface Props {
  theme: AppTheme;
  primaryColor: string;
  region: MapRegion;
  markerCoordinate: MapCoordinate;
  isBusy: boolean;
  mapsLinked: boolean;
  onMapControllerReady: (controller: MapController | null) => void;
  onRegionChangeComplete: (region: MapRegion) => void;
  onMarkerDragEnd: (coordinate: MapCoordinate) => void;
  onCurrentLocationPress: () => void;
}

const DRAG_DEGREES_PER_PIXEL = 0.00008;

export const LocationMapInteractivePanel = memo<Props>(
  ({
    theme,
    primaryColor,
    region,
    markerCoordinate,
    isBusy,
    mapsLinked,
    onMapControllerReady,
    onRegionChangeComplete,
    onMarkerDragEnd,
    onCurrentLocationPress,
  }) => {
    const mapStyles = useMemo(() => getLocationMapPickerStyles(theme), [theme]);
    const nativeMapRef = useRef<{ animateToRegion: (next: MapRegion, duration?: number) => void } | null>(
      null,
    );
    const mapsModule = mapsLinked ? getMapsNativeModule() : null;

    useEffect(() => {
      if (!mapsModule) {
        onMapControllerReady(null);
        return;
      }

      onMapControllerReady({
        animateToRegion: (nextRegion, duration = 350) => {
          nativeMapRef.current?.animateToRegion(nextRegion, duration);
        },
      });

      return () => onMapControllerReady(null);
    }, [mapsModule, onMapControllerReady]);

    const staticMapUri = useMemo(
      () => buildStaticMapPreviewUrl(markerCoordinate.latitude, markerCoordinate.longitude, 800, 400, 17),
      [markerCoordinate.latitude, markerCoordinate.longitude],
    );

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderRelease: (_, gestureState) => {
            onMarkerDragEnd({
              latitude: markerCoordinate.latitude - gestureState.dy * DRAG_DEGREES_PER_PIXEL,
              longitude: markerCoordinate.longitude + gestureState.dx * DRAG_DEGREES_PER_PIXEL,
            });
          },
        }),
      [markerCoordinate.latitude, markerCoordinate.longitude, onMarkerDragEnd],
    );

    const renderNativeMap = () => {
      if (!mapsModule) {
        return null;
      }

      const MapView = mapsModule.default;
      const { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } = mapsModule;
      const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

      return (
        <MapView
          ref={nativeMapRef}
          provider={mapProvider}
          style={mapStyles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled
          pitchEnabled
          scrollEnabled
          zoomEnabled
          loadingEnabled
          moveOnMarkerPress={false}
        >
          <Marker
            coordinate={markerCoordinate}
            draggable
            pinColor="#EF4444"
            onDragEnd={event => onMarkerDragEnd(event.nativeEvent.coordinate)}
          />
        </MapView>
      );
    };

    return (
      <View
        style={mapStyles.mapShell}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
      >
        {mapsModule ? (
          renderNativeMap()
        ) : (
          <View style={styles.fallbackMap}>
            <Image source={{ uri: staticMapUri }} style={mapStyles.map} resizeMode="cover" />
            <View style={styles.fallbackPinWrap} {...panResponder.panHandlers}>
              <Icon name="map-marker" size={36} color="#EF4444" />
            </View>
            {!mapsLinked ? (
              <View style={styles.rebuildBanner}>
                <Text style={styles.rebuildText}>
                  Map module not loaded. Rebuild the app after installing react-native-maps.
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {isBusy ? (
          <View style={mapStyles.mapOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={primaryColor} />
          </View>
        ) : null}

        <Pressable
          style={mapStyles.currentLocationBtn}
          onPress={onCurrentLocationPress}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
        >
          <Icon name="crosshairs-gps" size={22} color="#2563EB" />
        </Pressable>
      </View>
    );
  },
);

LocationMapInteractivePanel.displayName = 'LocationMapInteractivePanel';

const styles = StyleSheet.create({
  fallbackMap: {
    flex: 1,
    backgroundColor: '#E8EEF5',
  },
  fallbackPinWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  rebuildBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rebuildText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
