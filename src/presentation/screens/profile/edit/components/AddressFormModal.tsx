import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LocationPayload, UserLocation } from '../../../../../types/profileEdit.types';
import { resolveLocationCoordinates } from '../../../../../utils/resolveLocationCoordinates';
import { AddressFieldInput } from './AddressFieldInput';
import { AddressLabelChips } from './AddressLabelChips';
import { AddressMapPickerModal } from './AddressMapPickerModal';
import { AddressMapPreview } from './AddressMapPreview';
import { DEFAULT_ADDRESS_COORDINATES } from '../utils/locationDtoUtils';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props {
  visible: boolean;
  initial?: UserLocation | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: LocationPayload, editId?: string) => void;
}

const buildDetailLocation = (options: {
  detailLocation: string;
  city: string;
  building: string;
  apartment: string;
}): string => {
  if (options.detailLocation.trim()) {
    return options.detailLocation.trim();
  }

  return [options.city, options.building, options.apartment].map(part => part.trim()).filter(Boolean).join(', ');
};

export const AddressFormModal = memo<Props>(({ visible, initial, saving, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initial?.id);

  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomLabelInput, setShowCustomLabelInput] = useState(false);
  const [city, setCity] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [detailLocation, setDetailLocation] = useState('');
  const [latitude, setLatitude] = useState<number>(DEFAULT_ADDRESS_COORDINATES.latitude);
  const [longitude, setLongitude] = useState<number>(DEFAULT_ADDRESS_COORDINATES.longitude);
  const [isDefault, setIsDefault] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ city?: string; building?: string }>({});

  const resetForm = useCallback(() => {
    const resolved = resolveLocationCoordinates({
      latitude: initial?.latitude,
      longitude: initial?.longitude,
      locationHint: [initial?.city, initial?.building, initial?.detailLocation].filter(Boolean).join(', '),
    });

    const nextLabel = initial?.label ?? 'Home';
    const isPresetLabel = ['Home', 'Office', 'Home 2'].includes(nextLabel);

    setLabel(nextLabel);
    setCustomLabel(isPresetLabel ? '' : nextLabel);
    setShowCustomLabelInput(!isPresetLabel && Boolean(nextLabel));
    setCity(initial?.city ?? '');
    setBuilding(initial?.building ?? '');
    setApartment(initial?.apartment ?? '');
    setDetailLocation(initial?.detailLocation ?? '');
    setLatitude(resolved.latitude);
    setLongitude(resolved.longitude);
    setIsDefault(Boolean(initial?.isDefault));
    setFieldErrors({});
    setMapPickerVisible(false);
  }, [initial]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    resetForm();
  }, [resetForm, visible]);

  const handleCoordinateChange = useCallback((nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
  }, []);

  const canSubmit = useMemo(
    () => Boolean(label.trim() && city.trim() && building.trim()),
    [building, city, label],
  );

  const submit = () => {
    const nextErrors: { city?: string; building?: string } = {};

    if (!city.trim()) {
      nextErrors.city = 'City or area is required';
    }
    if (!building.trim()) {
      nextErrors.building = 'Building or street is required';
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert('Location required', 'Please pin your location on the map before saving.');
      return;
    }

    const resolvedDetailLocation = buildDetailLocation({
      detailLocation,
      city,
      building,
      apartment,
    });

    onSave(
      {
        label: label.trim() || 'Home',
        city: city.trim(),
        building: building.trim(),
        apartment: apartment.trim() || undefined,
        detailLocation: resolvedDetailLocation,
        coordinates: [latitude, longitude],
        isDefault,
      },
      initial?.id,
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
          <View style={peStyles.header}>
            <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Go back">
              <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
            </Pressable>
            <Text style={peStyles.headerTitle}>Location Details</Text>
            <View style={peStyles.headerBtn} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <AddressMapPreview
                latitude={latitude}
                longitude={longitude}
                onShowMap={() => setMapPickerVisible(true)}
              />

              <AddressFieldInput
                value={city}
                onChangeText={setCity}
                placeholder="City or area (e.g. Business Bay, Dubai)"
                error={fieldErrors.city}
              />
              <AddressFieldInput
                value={building}
                onChangeText={setBuilding}
                placeholder="Building or street name"
                error={fieldErrors.building}
              />
              <AddressFieldInput
                value={apartment}
                onChangeText={setApartment}
                placeholder="Enter Apartment or Villa Number"
              />

              <AddressLabelChips
                value={label}
                onChange={setLabel}
                customLabel={customLabel}
                onCustomLabelChange={setCustomLabel}
                showCustomInput={showCustomLabelInput}
                onShowCustomInput={() => setShowCustomLabelInput(true)}
              />

              <View style={peStyles.defaultToggleRow}>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={isDefault ? PE_COLORS.primary : '#F9FAFB'}
                  accessibilityLabel="Set as default location"
                />
                <Text style={peStyles.radioLabel}>Set as default</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={[peStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              style={[
                peStyles.submitBtn,
                saving || !canSubmit ? peStyles.submitBtnDisabled : null,
              ]}
              onPress={submit}
              disabled={saving || !canSubmit}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Update location' : 'Save location'}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={peStyles.submitText}>
                  {isEditing ? 'Update Location' : 'Save Location'}
                </Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <AddressMapPickerModal
        visible={mapPickerVisible}
        latitude={latitude}
        longitude={longitude}
        onClose={() => setMapPickerVisible(false)}
        onCoordinateChange={handleCoordinateChange}
        onCityChange={setCity}
        onBuildingChange={setBuilding}
        onDetailLocationChange={setDetailLocation}
      />
    </>
  );
});

AddressFormModal.displayName = 'AddressFormModal';
