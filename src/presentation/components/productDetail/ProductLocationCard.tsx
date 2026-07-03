import React, { memo, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { buildStaticMapPreviewUrl } from '../../../utils/staticMapUrl';
import { resolveLocationCoordinates } from '../../../utils/resolveLocationCoordinates';
import { AppText } from '../common/AppText';
import { pdStyles } from './productDetailStyles';

interface Props {
  title: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  onShowMap?: () => void;
  hideTitle?: boolean;
}

export const ProductLocationCard = memo<Props>(
  ({ title, address, latitude, longitude, onShowMap, hideTitle = false }) => {
    const { width: screenWidth } = useWindowDimensions();
    const [mapLoadFailed, setMapLoadFailed] = useState(false);

    const coordinates = useMemo(
      () =>
        resolveLocationCoordinates({
          latitude,
          longitude,
          locationHint: [title, address].filter(Boolean).join(', '),
        }),
      [address, latitude, longitude, title],
    );

    const mapPreviewUrl = useMemo(() => {
      const mapWidth = Math.min(Math.round(screenWidth * 2), 960);
      const mapHeight = Math.round(mapWidth * 0.5);
      return buildStaticMapPreviewUrl(
        coordinates.latitude,
        coordinates.longitude,
        mapWidth,
        mapHeight,
        17,
      );
    }, [coordinates.latitude, coordinates.longitude, screenWidth]);

    return (
      <View>
        {!hideTitle ? <AppText style={pdStyles.sectionTitle}>Location</AppText> : null}
        <AppText style={styles.subtitle} numberOfLines={2}>
          {title}
        </AppText>

        <View style={pdStyles.mapCard}>
          {!mapLoadFailed ? (
            <Image
              source={{ uri: mapPreviewUrl }}
              style={styles.mapImage}
              resizeMode="cover"
              onError={() => setMapLoadFailed(true)}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={styles.mapFallback}>
              <Icon name="map-marker" size={36} color="#2563EB" />
            </View>
          )}

          <View style={styles.pinOverlay} pointerEvents="none">
            <Icon name="map-marker" size={28} color="#2563EB" />
          </View>

          <Pressable
            style={pdStyles.mapBtn}
            onPress={onShowMap}
            accessibilityRole="button"
            accessibilityLabel="Show map"
          >
            <Icon name="map-marker" size={18} color="#2563EB" />
            <AppText weight="700" style={styles.showMapText}>
              Show Map
            </AppText>
          </Pressable>
        </View>

        <AppText style={styles.address} numberOfLines={3}>
          {address}
        </AppText>
      </View>
    );
  },
);

ProductLocationCard.displayName = 'ProductLocationCard';

const styles = StyleSheet.create({
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 10,
  },
  mapImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF5',
  },
  pinOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  showMapText: {
    color: '#2563EB',
    fontSize: 14,
  },
  address: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
});
