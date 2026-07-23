import React, { memo, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useMapLocationPicker } from '../../hooks/useMapLocationPicker';
import { getLocationMapPickerStyles } from './locationMapPickerStyles';
import { LocationMapInteractivePanel } from './LocationMapInteractivePanel';
import { LocationMapPickerModal } from './LocationMapPickerModal';

interface Props {
  locateYourItem: string;
  address: string;
  latitude: number;
  longitude: number;
  onLocateYourItemChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCoordinateChange: (lat: number, lng: number) => void;
  styles: CreatePostStyles;
}

export const LocationMapPicker = memo<Props>(
  ({
    locateYourItem,
    address,
    latitude,
    longitude,
    onLocateYourItemChange,
    onAddressChange,
    onCoordinateChange,
    styles,
  }) => {
    const theme = useAppTheme();
    const mapStyles = useMemo(() => getLocationMapPickerStyles(theme), [theme]);

    const [pickerVisible, setPickerVisible] = useState(false);
    const {
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
    } = useMapLocationPicker({
      latitude,
      longitude,
      onCoordinateChange,
      onLocateYourItemChange,
      onAddressChange,
    });

    const isBusy = isLocating || isGeocoding;

    return (
      <View style={mapStyles.wrapper}>
        <Text style={mapStyles.sectionTitle}>Confirm your location</Text>

        <TextInput
          value={locateYourItem}
          onChangeText={onLocateYourItemChange}
          placeholder="Locate your item (e.g. Near Marina Mall)"
          placeholderTextColor="#8E8E93"
          style={mapStyles.input}
        />
        <TextInput
          value={address}
          onChangeText={onAddressChange}
          placeholder="Building or Street name"
          placeholderTextColor="#8E8E93"
          style={mapStyles.input}
        />

        <View style={mapStyles.card}>
          <View style={mapStyles.cardHeader}>
            <Text style={mapStyles.cardTitle}>Is the pin in the right location?</Text>
            <View style={mapStyles.infoIconWrap}>
              <Icon name="information-variant" size={14} color={theme.text} />
            </View>
          </View>

          <Text style={mapStyles.cardDescription}>
            Click and drag the pin to the exact spot. Users are more likely to respond to ads
            that are correctly shown on the map.
          </Text>

          <LocationMapInteractivePanel
            theme={theme}
            primaryColor={styles.primaryBtn.backgroundColor}
            region={region}
            markerCoordinate={markerCoordinate}
            isBusy={isBusy}
            mapsLinked={mapsLinked}
            onMapControllerReady={handleMapControllerReady}
            onRegionChangeComplete={handleRegionChangeComplete}
            onMarkerDragEnd={handleMarkerDragEnd}
            onCurrentLocationPress={handleCurrentLocationPress}
            onMapPress={() => setPickerVisible(true)}
          />

          {statusMessage ? <Text style={mapStyles.statusText}>{statusMessage}</Text> : null}
          {permissionDenied && !statusMessage ? (
            <Text style={mapStyles.statusText}>
              Location permission denied. Drag the pin manually or enable location in Settings.
            </Text>
          ) : null}
        </View>
        <LocationMapPickerModal
          visible={pickerVisible}
          latitude={markerCoordinate.latitude}
          longitude={markerCoordinate.longitude}
          locateYourItem={locateYourItem}
          address={address}
          primaryColor={styles.primaryBtn.backgroundColor}
          onClose={() => setPickerVisible(false)}
          onConfirm={({ latitude: nextLat, longitude: nextLng, locateYourItem: nextLocate, address: nextAddress }) => {
            onCoordinateChange(nextLat, nextLng);
            onLocateYourItemChange(nextLocate);
            onAddressChange(nextAddress);
          }}
        />
      </View>
    );
  },
);

LocationMapPicker.displayName = 'LocationMapPicker';
