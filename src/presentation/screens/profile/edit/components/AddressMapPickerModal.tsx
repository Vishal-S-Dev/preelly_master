import React, { memo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LocationMapInteractivePanel } from '../../../../components/createPost/LocationMapInteractivePanel';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { useMapLocationPicker } from '../../../../hooks/useMapLocationPicker';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props {
  visible: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onCoordinateChange: (lat: number, lng: number) => void;
  onCityChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onDetailLocationChange: (value: string) => void;
}

export const AddressMapPickerModal = memo<Props>(
  ({
    visible,
    latitude,
    longitude,
    onClose,
    onCoordinateChange,
    onCityChange,
    onBuildingChange,
    onDetailLocationChange,
  }) => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const primaryColor = PE_COLORS.primary;

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
      onLocateYourItemChange: onCityChange,
      onAddressChange: onBuildingChange,
      onDetailLocationChange,
    });

    const isBusy = isLocating || isGeocoding;

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
          <View style={peStyles.header}>
            <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Close map">
              <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
            </Pressable>
            <Text style={peStyles.headerTitle}>Select location</Text>
            <View style={peStyles.headerBtn} />
          </View>

          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={[peStyles.mapPreviewTitle, { marginBottom: 6 }]}>Move the pin to your exact spot</Text>
            <Text style={[peStyles.mapPreviewSubtitle, { marginBottom: 14 }]}>
              Drag the pin or use your current location. Your address fields will update automatically.
            </Text>

            <View style={{ flex: 1, minHeight: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              <LocationMapInteractivePanel
                theme={theme}
                primaryColor={primaryColor}
                region={region}
                markerCoordinate={markerCoordinate}
                isBusy={isBusy}
                mapsLinked={mapsLinked}
                onMapControllerReady={handleMapControllerReady}
                onRegionChangeComplete={handleRegionChangeComplete}
                onMarkerDragEnd={handleMarkerDragEnd}
                onCurrentLocationPress={handleCurrentLocationPress}
              />
            </View>

            {statusMessage ? (
              <Text style={[peStyles.sectionSubtitle, { marginTop: 10 }]}>{statusMessage}</Text>
            ) : null}
            {permissionDenied && !statusMessage ? (
              <Text style={[peStyles.sectionSubtitle, { marginTop: 10 }]}>
                Location permission denied. Drag the pin manually or enable location in Settings.
              </Text>
            ) : null}
          </View>

          <View style={[peStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              style={peStyles.submitBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Confirm map location">
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={peStyles.submitText}>Confirm location</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

AddressMapPickerModal.displayName = 'AddressMapPickerModal';
