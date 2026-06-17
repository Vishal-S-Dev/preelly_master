import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPayload, UserLocation } from '../../../../../types/profileEdit.types';
import { PE_COLORS, peStyles } from '../profileEditStyles';

const PRESET_LABELS = ['Home', 'Office', 'Home 2'];

interface Props {
  visible: boolean;
  initial?: UserLocation | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: LocationPayload, editId?: string) => void;
}

export const AddressFormModal = memo<Props>(({ visible, initial, saving, onClose, onSave }) => {
  const [label, setLabel] = useState('Home');
  const [city, setCity] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setLabel(initial?.label ?? 'Home');
    setCity(initial?.city ?? '');
    setBuilding(initial?.building ?? '');
    setApartment(initial?.apartment ?? '');
    setIsDefault(Boolean(initial?.isDefault));
  }, [initial, visible]);

  const submit = () => {
    onSave(
      {
        label: label.trim() || 'Home',
        city: city.trim(),
        building: building.trim(),
        apartment: apartment.trim(),
        isDefault,
      },
      initial?.id,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={peStyles.header}>
          <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Close">
            <Text style={{ fontSize: 22 }}>×</Text>
          </Pressable>
          <Text style={peStyles.headerTitle}>{initial ? 'Edit location' : 'Add new location'}</Text>
          <View style={peStyles.headerBtn} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={peStyles.sectionSubtitle}>Label</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {PRESET_LABELS.map(item => (
              <Pressable
                key={item}
                onPress={() => setLabel(item)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: label === item ? PE_COLORS.primaryLight : '#F3F4F6',
                }}>
                <Text style={{ color: label === item ? PE_COLORS.primary : PE_COLORS.text, fontWeight: '600' }}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={peStyles.sectionSubtitle}>City</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            style={{
              borderWidth: 1,
              borderColor: PE_COLORS.border,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              color: PE_COLORS.text,
            }}
          />
          <Text style={peStyles.sectionSubtitle}>Building / Street</Text>
          <TextInput
            value={building}
            onChangeText={setBuilding}
            placeholder="Building, street, area"
            style={{
              borderWidth: 1,
              borderColor: PE_COLORS.border,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              color: PE_COLORS.text,
            }}
          />
          <Text style={peStyles.sectionSubtitle}>Apartment / Unit</Text>
          <TextInput
            value={apartment}
            onChangeText={setApartment}
            placeholder="Apartment, floor, unit"
            style={{
              borderWidth: 1,
              borderColor: PE_COLORS.border,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: PE_COLORS.text,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={peStyles.radioLabel}>Set as default</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={isDefault ? PE_COLORS.primary : '#F9FAFB'}
            />
          </View>
          <Pressable
            style={[peStyles.submitBtn, { marginTop: 24 }, saving ? peStyles.submitBtnDisabled : null]}
            onPress={submit}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={peStyles.submitText}>Save location</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

AddressFormModal.displayName = 'AddressFormModal';
