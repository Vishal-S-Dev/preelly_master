import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { buildStaticMapPreviewUrl } from '../../../../../utils/staticMapUrl';
import { resolveGoogleMapsProvider } from '../../../../../utils/mapProvider';
import { getMapsNativeModule } from '../../../../../utils/mapsNativeModule';
import { peStyles } from '../profileEditStyles';

interface Props {
  latitude: number;
  longitude: number;
  onShowMap: () => void;
}

/**
 * In-card pinned location preview — Google Maps on Android + iOS.
 * Tap overlay sits above MapView so Show Map always works on iOS.
 */
export const AddressMapPreview = memo<Props>(({ latitude, longitude, onShowMap }) => {
  const { width: screenWidth } = useWindowDimensions();
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [staticLoading, setStaticLoading] = useState(true);
  const mapsModule = useMemo(() => getMapsNativeModule(), []);
  const googleProvider = useMemo(() => resolveGoogleMapsProvider(), []);

  const region = useMemo(
    () => ({
      latitude: Number.isFinite(latitude) ? latitude : 25.2048,
      longitude: Number.isFinite(longitude) ? longitude : 55.2708,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }),
    [latitude, longitude],
  );

  const mapPreviewUrl = useMemo(() => {
    const mapWidth = Math.min(Math.round(screenWidth * 2), 960);
    const mapHeight = Math.round(mapWidth * 0.52);
    return buildStaticMapPreviewUrl(
      region.latitude,
      region.longitude,
      mapWidth,
      mapHeight,
      16,
    );
  }, [region.latitude, region.longitude, screenWidth]);

  useEffect(() => {
    setMapLoadFailed(false);
    setStaticLoading(true);
  }, [mapPreviewUrl]);

  const renderNativePreview = () => {
    if (!mapsModule) {
      return null;
    }

    const MapView = mapsModule.default;
    const { Marker } = mapsModule;

    return (
      <MapView
        style={styles.mapFill}
        provider={googleProvider}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled
        {...(Platform.OS === 'android' ? { liteMode: true } : null)}
      >
        <Marker
          coordinate={{ latitude: region.latitude, longitude: region.longitude }}
          pinColor="#2563EB"
          tracksViewChanges={false}
        />
      </MapView>
    );
  };

  const renderStaticPreview = () => {
    if (mapLoadFailed) {
      return (
        <View style={styles.mapFallback}>
          <Icon name="map-outline" size={42} color="#93C5FD" />
          <Text style={styles.mapFallbackText}>Tap to open map</Text>
        </View>
      );
    }

    return (
      <>
        <Image
          source={{ uri: mapPreviewUrl }}
          style={styles.mapFill}
          resizeMode="cover"
          onLoadStart={() => setStaticLoading(true)}
          onLoad={() => setStaticLoading(false)}
          onError={() => {
            setStaticLoading(false);
            setMapLoadFailed(true);
          }}
          accessibilityIgnoresInvertColors
        />
        {staticLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : null}
        <View style={styles.pinOverlay} pointerEvents="none">
          <Icon name="map-marker" size={30} color="#2563EB" />
        </View>
      </>
    );
  };

  return (
    <View style={peStyles.mapPreviewCard}>
      <Text style={peStyles.mapPreviewTitle}>Pinned location</Text>
      <Text style={peStyles.mapPreviewSubtitle}>
        Click on the map to select or edit your location
      </Text>

      <View style={peStyles.mapPreviewShell}>
        {mapsModule ? renderNativePreview() : renderStaticPreview()}

        <Pressable
          style={styles.tapOverlay}
          onPress={onShowMap}
          accessibilityRole="button"
          accessibilityLabel="Open map to select location"
        />

        <View style={peStyles.mapShowBtn} pointerEvents="none">
          <Icon name="map-marker" size={18} color="#2563EB" />
          <Text style={peStyles.mapShowBtnText}>Show Map</Text>
        </View>
      </View>
    </View>
  );
});

AddressMapPreview.displayName = 'AddressMapPreview';

const styles = StyleSheet.create({
  mapFill: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  tapOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },
  mapFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF5',
    gap: 8,
  },
  mapFallbackText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 238, 245, 0.55)',
  },
  pinOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 36,
  },
});
