import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MapCoordinate } from '../../../types/mapRegion.types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useMapLocationPicker } from '../../hooks/useMapLocationPicker';
import { LocationMapInteractivePanel } from './LocationMapInteractivePanel';
import { getLocationMapPickerStyles } from './locationMapPickerStyles';

interface Props {
  visible: boolean;
  latitude: number;
  longitude: number;
  locateYourItem: string;
  address: string;
  primaryColor: string;
  onClose: () => void;
  onConfirm: (payload: {
    latitude: number;
    longitude: number;
    locateYourItem: string;
    address: string;
  }) => void;
}

export const LocationMapPickerModal = memo<Props>(
  ({
    visible,
    latitude,
    longitude,
    locateYourItem,
    address,
    primaryColor,
    onClose,
    onConfirm,
  }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => getLocationMapPickerStyles(theme), [theme]);
    const [draftLocate, setDraftLocate] = useState(locateYourItem);
    const [draftAddress, setDraftAddress] = useState(address);
    const [draftCoordinate, setDraftCoordinate] = useState<MapCoordinate>({
      latitude,
      longitude,
    });

    const {
      region,
      markerCoordinate,
      isLocating,
      isGeocoding,
      statusMessage,
      permissionDenied,
      mapsLinked,
      handleMapControllerReady,
      handleCurrentLocationPress,
      handleRegionChangeComplete,
      handleMarkerDragEnd,
    } = useMapLocationPicker({
      latitude: draftCoordinate.latitude,
      longitude: draftCoordinate.longitude,
      onCoordinateChange: (lat, lng) => {
        setDraftCoordinate({ latitude: lat, longitude: lng });
      },
      onLocateYourItemChange: setDraftLocate,
      onAddressChange: setDraftAddress,
    });

    useEffect(() => {
      if (!visible) {
        return;
      }
      setDraftLocate(locateYourItem);
      setDraftAddress(address);
      setDraftCoordinate({ latitude, longitude });
    }, [address, latitude, locateYourItem, longitude, visible]);

    const onMarkerDrag = useCallback(
      (coordinate: MapCoordinate) => {
        handleMarkerDragEnd(coordinate);
        setDraftCoordinate(coordinate);
      },
      [handleMarkerDragEnd],
    );

    const onConfirmPress = useCallback(() => {
      onConfirm({
        latitude: markerCoordinate.latitude,
        longitude: markerCoordinate.longitude,
        locateYourItem: draftLocate,
        address: draftAddress,
      });
      onClose();
    }, [draftAddress, draftLocate, markerCoordinate.latitude, markerCoordinate.longitude, onClose, onConfirm]);

    const isBusy = isLocating || isGeocoding;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalRoot} edges={['top']}>
          <View style={styles.modalHeader}>
            <Pressable style={styles.modalHeaderBtn} onPress={onClose}>
              <Icon name="close" size={24} color={theme.text} />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Select location</Text>
            <View style={styles.modalHeaderBtn} />
          </View>

          <View style={styles.modalMapWrap}>
            <LocationMapInteractivePanel
              theme={theme}
              primaryColor={primaryColor}
              region={region}
              markerCoordinate={markerCoordinate}
              isBusy={isBusy}
              mapsLinked={mapsLinked}
              onMapControllerReady={handleMapControllerReady}
              onRegionChangeComplete={handleRegionChangeComplete}
              onMarkerDragEnd={onMarkerDrag}
              onCurrentLocationPress={handleCurrentLocationPress}
            />
          </View>

          <View style={styles.modalBottomCard}>
            <Text style={styles.modalAddressLabel}>Selected location</Text>
            <Text style={styles.modalAddressValue} numberOfLines={2}>
              {draftLocate || draftAddress || 'Move the marker to pick location'}
            </Text>
            <Text style={styles.modalCoords}>
              {markerCoordinate.latitude.toFixed(6)}, {markerCoordinate.longitude.toFixed(6)}
            </Text>
            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
            {permissionDenied && !statusMessage ? (
              <Text style={styles.statusText}>
                Location permission denied. You can still drag the marker manually.
              </Text>
            ) : null}

            <View style={styles.modalActionRow}>
              <Pressable style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={onConfirmPress} disabled={isBusy}>
                {isBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Location</Text>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

LocationMapPickerModal.displayName = 'LocationMapPickerModal';
