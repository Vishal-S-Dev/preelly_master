import React, { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LocationMapInteractivePanel } from '../../../../components/createPost/LocationMapInteractivePanel';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { useMapLocationPicker } from '../../../../hooks/useMapLocationPicker';
import { PlaceSelection } from '../../../../../utils/placesSearch';
import { PE_COLORS, peStyles } from '../profileEditStyles';
import { AddressPlaceSearch } from './AddressPlaceSearch';

interface Props {
  latitude: number;
  longitude: number;
  onClose: () => void;
  onCoordinateChange: (lat: number, lng: number) => void;
  onCityChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onDetailLocationChange: (value: string) => void;
}

/**
 * Full-screen map picker content (no Modal wrapper).
 * Rendered inside AddressFormModal's single Modal so iOS can open it —
 * a second nested Modal over pageSheet often fails to present on iOS.
 */
export const AddressMapPickerScreen = memo<Props>(
  ({
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
    const { height: windowHeight } = useWindowDimensions();
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
      selectPlace,
    } = useMapLocationPicker({
      latitude,
      longitude,
      onCoordinateChange,
      onLocateYourItemChange: onCityChange,
      onAddressChange: onBuildingChange,
      onDetailLocationChange,
    });

    const isBusy = isLocating || isGeocoding;

    const footerPaddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 16);
    const contentBottomPad = useMemo(
      () => hp('10%') + footerPaddingBottom,
      [footerPaddingBottom],
    );
    const mapMinHeight = useMemo(
      () => Math.max(hp('34%'), Math.min(windowHeight * 0.42, hp('48%'))),
      [windowHeight],
    );

    const handlePlaceSelected = useCallback(
      (place: PlaceSelection) => {
        selectPlace(place);
      },
      [selectPlace],
    );

    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View
          style={[
            peStyles.header,
            {
              paddingTop: Platform.OS === 'android' ? Math.max(insets.top * 0.15, 0) : 0,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={peStyles.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close map"
          >
            <Icon name="arrow-left" size={wp('6%')} color={PE_COLORS.text} />
          </Pressable>
          <Text style={peStyles.headerTitle} numberOfLines={1}>
            Select location
          </Text>
          <View style={peStyles.headerBtn} />
        </View>

        <View
          style={[
            styles.content,
            {
              paddingBottom: contentBottomPad,
            },
          ]}
        >
          <Text style={[peStyles.mapPreviewTitle, styles.title]}>
            Move the pin to your exact spot
          </Text>
          <Text style={[peStyles.mapPreviewSubtitle, styles.subtitle]}>
            Search an address, drag the pin, or use your current location. Address fields update
            automatically.
          </Text>

          <AddressPlaceSearch onPlaceSelected={handlePlaceSelected} disabled={isLocating} />

          <View style={[styles.mapShell, { minHeight: mapMinHeight }]}>
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
            <Text style={[peStyles.sectionSubtitle, styles.status]}>
              {statusMessage}
            </Text>
          ) : null}
          {permissionDenied && !statusMessage ? (
            <Text style={[peStyles.sectionSubtitle, styles.status]}>
              Location permission denied. Search an address, drag the pin, or enable location in
              Settings.
            </Text>
          ) : null}
        </View>

        <View style={[peStyles.footer, { paddingBottom: footerPaddingBottom }]}>
          <Pressable
            style={[peStyles.submitBtn, isBusy && peStyles.submitBtnDisabled]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Confirm map location"
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={peStyles.submitText}>Confirm location</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  },
);

AddressMapPickerScreen.displayName = 'AddressMapPickerScreen';

/** @deprecated Prefer AddressMapPickerScreen inside a single parent Modal (iOS-safe). */
export const AddressMapPickerModal = AddressMapPickerScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PE_COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.2%'),
  },
  title: {
    marginBottom: hp('0.6%'),
  },
  subtitle: {
    marginTop: 0,
    marginBottom: hp('1.4%'),
  },
  mapShell: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E8EEF5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PE_COLORS.border,
  },
  status: {
    marginTop: hp('1.2%'),
    marginBottom: 0,
  },
});
