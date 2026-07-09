import React, { memo, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { buildStaticMapPreviewUrl } from '../../../../../utils/staticMapUrl';
import { peStyles } from '../profileEditStyles';

interface Props {
  latitude: number;
  longitude: number;
  onShowMap: () => void;
}

export const AddressMapPreview = memo<Props>(({ latitude, longitude, onShowMap }) => {
  const { width: screenWidth } = useWindowDimensions();
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

  const mapPreviewUrl = useMemo(() => {
    const mapWidth = Math.min(Math.round(screenWidth * 2), 960);
    const mapHeight = Math.round(mapWidth * 0.52);
    return buildStaticMapPreviewUrl(latitude, longitude, mapWidth, mapHeight, 16);
  }, [latitude, longitude, screenWidth]);

  return (
    <View style={peStyles.mapPreviewCard}>
      <Text style={peStyles.mapPreviewTitle}>Pinned location</Text>
      <Text style={peStyles.mapPreviewSubtitle}>
        Click on the map to select or edit your location
      </Text>

      <Pressable
        style={peStyles.mapPreviewShell}
        onPress={onShowMap}
        accessibilityRole="button"
        accessibilityLabel="Open map to select location">
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
            <Icon name="map-outline" size={42} color="#93C5FD" />
          </View>
        )}

        <View style={styles.pinOverlay} pointerEvents="none">
          <Icon name="map-marker" size={30} color="#2563EB" />
        </View>

        <View style={peStyles.mapShowBtn} pointerEvents="none">
          <Icon name="map-marker" size={18} color="#2563EB" />
          <Text style={peStyles.mapShowBtnText}>Show Map</Text>
        </View>
      </Pressable>
    </View>
  );
});

AddressMapPreview.displayName = 'AddressMapPreview';

const styles = StyleSheet.create({
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
    paddingBottom: 36,
  },
});
