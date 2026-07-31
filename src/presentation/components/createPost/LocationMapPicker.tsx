import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useMapLocationPicker } from '../../hooks/useMapLocationPicker';
import { buildStaticMapPreviewUrl } from '../../../utils/staticMapUrl';
import { resolveGoogleMapsProvider } from '../../../utils/mapProvider';
import { getMapsNativeModule } from '../../../utils/mapsNativeModule';
import { AddressMapPickerScreen } from '../../screens/profile/edit/components/AddressMapPickerModal';
import { getLocationMapPickerStyles } from './locationMapPickerStyles';

interface Props {
  locateYourItem: string;
  address: string;
  latitude: number;
  longitude: number;
  onLocateYourItemChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCoordinateChange: (lat: number, lng: number) => void;
  styles: CreatePostStyles;
  /**
   * When false, address inputs are owned by dynamic form fields
   * ("Locate your item" / "Building & Street Name") rendered by the parent.
   */
  showAddressFields?: boolean;
  showTip?: boolean;
}

const INFO_MESSAGE =
  'Click and drag the pin to the exact spot. Users are more likely to respond to ads that are correctly shown on the map.';

export const LocationMapPicker = memo<Props>(
  ({
    locateYourItem,
    address,
    latitude,
    longitude,
    onLocateYourItemChange,
    onAddressChange,
    onCoordinateChange,
    showAddressFields = true,
    showTip = true,
  }) => {
    const theme = useAppTheme();
    const mapStyles = useMemo(() => getLocationMapPickerStyles(theme), [theme]);
    const { width: screenWidth } = useWindowDimensions();
    const [pickerVisible, setPickerVisible] = useState(false);
    const [mapLoadFailed, setMapLoadFailed] = useState(false);
    const [staticLoading, setStaticLoading] = useState(true);

    const mapsModule = useMemo(() => getMapsNativeModule(), []);
    const googleProvider = useMemo(() => resolveGoogleMapsProvider(), []);

    // Keep existing auto GPS / reverse-geocode behavior for default coordinates.
    useMapLocationPicker({
      latitude,
      longitude,
      onCoordinateChange,
      onLocateYourItemChange,
      onAddressChange,
    });

    const region = useMemo(
      () => ({
        latitude: Number.isFinite(latitude) ? latitude : 24.4539,
        longitude: Number.isFinite(longitude) ? longitude : 54.3773,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }),
      [latitude, longitude],
    );

    const mapPreviewUrl = useMemo(() => {
      const mapWidth = Math.min(Math.round(screenWidth * 2), 960);
      const mapHeight = Math.round(mapWidth * 0.55);
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

    const openPicker = useCallback(() => {
      setPickerVisible(true);
    }, []);

    const closePicker = useCallback(() => {
      setPickerVisible(false);
    }, []);

    const showInfo = useCallback(() => {
      Alert.alert('Confirm your location', INFO_MESSAGE);
    }, []);

    const handleDetailLocationChange = useCallback(
      (value: string) => {
        if (!locateYourItem.trim() && value.trim()) {
          onLocateYourItemChange(value);
        }
      },
      [locateYourItem, onLocateYourItemChange],
    );

    const renderNativePreview = () => {
      if (!mapsModule) {
        return null;
      }

      const MapView = mapsModule.default;
      const { Marker } = mapsModule;

      return (
        <MapView
          style={mapStyles.map}
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
            pinColor="#EF4444"
            tracksViewChanges={false}
          />
        </MapView>
      );
    };

    const renderStaticPreview = () => {
      if (mapLoadFailed) {
        return (
          <View style={previewStyles.fallback}>
            <Icon name="map-outline" size={42} color="#93C5FD" />
            <Text style={previewStyles.fallbackText}>Tap to select location</Text>
          </View>
        );
      }

      return (
        <>
          <Image
            source={{ uri: mapPreviewUrl }}
            style={mapStyles.map}
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
            <View style={mapStyles.mapOverlay} pointerEvents="none">
              <ActivityIndicator color="#0000FF" />
            </View>
          ) : null}
          <View style={previewStyles.pinOverlay} pointerEvents="none">
            <Icon name="map-marker" size={34} color="#EF4444" />
          </View>
        </>
      );
    };

    return (
      <View style={mapStyles.wrapper}>
        <Text style={mapStyles.sectionTitle}>Confirm your location</Text>

        <View style={mapStyles.card}>
          <View style={mapStyles.cardHeader}>
            <Text style={mapStyles.cardTitle}>Is the pin in the right location?</Text>
            <Pressable
              style={mapStyles.infoIconWrap}
              onPress={showInfo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Location tip"
            >
              <Icon name="information-variant" size={13} color="#111827" />
            </Pressable>
          </View>

          <Text style={mapStyles.cardDescription}>{INFO_MESSAGE}</Text>

          <View style={mapStyles.mapShell}>
            {mapsModule ? renderNativePreview() : renderStaticPreview()}

            <Pressable
              style={mapStyles.mapTapOverlay}
              onPress={openPicker}
              accessibilityRole="button"
              accessibilityLabel="Open map to select location"
            />
          </View>
        </View>

        {showAddressFields ? (
          <>
            <View style={mapStyles.fieldBlock}>
              <Text style={mapStyles.fieldLabel}>Locate your item</Text>
              <View style={mapStyles.inputShell}>
                <TextInput
                  value={locateYourItem}
                  onChangeText={onLocateYourItemChange}
                  placeholder="Building or Street name"
                  placeholderTextColor="#9CA3AF"
                  style={mapStyles.input}
                  accessibilityLabel="Locate your item"
                />
                <Text style={mapStyles.optionalText}>Optional</Text>
              </View>
            </View>

            <View style={mapStyles.fieldBlock}>
              <Text style={mapStyles.fieldLabel}>Building or Street name</Text>
              <View style={mapStyles.inputShell}>
                <TextInput
                  value={address}
                  onChangeText={onAddressChange}
                  placeholder="Building or Street name"
                  placeholderTextColor="#9CA3AF"
                  style={mapStyles.input}
                  accessibilityLabel="Building or Street name"
                />
                <Text style={mapStyles.optionalText}>Optional</Text>
              </View>
            </View>
          </>
        ) : null}

        {showTip && showAddressFields ? (
          <View style={mapStyles.tipBox}>
            <Text style={mapStyles.tipText}>
              Make sure the car information you have entered is correct. You will only be able to
              make changes once the ad is live.
            </Text>
          </View>
        ) : null}

        <Modal
          visible={pickerVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closePicker}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
            <AddressMapPickerScreen
              latitude={latitude}
              longitude={longitude}
              onClose={closePicker}
              onCoordinateChange={onCoordinateChange}
              onCityChange={onLocateYourItemChange}
              onBuildingChange={onAddressChange}
              onDetailLocationChange={handleDetailLocationChange}
            />
          </SafeAreaView>
        </Modal>
      </View>
    );
  },
);

LocationMapPicker.displayName = 'LocationMapPicker';

const previewStyles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF5',
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  pinOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
});
