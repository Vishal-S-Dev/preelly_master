import React, { memo } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserLocation } from '../../../../../types/profileEdit.types';
import { peStyles } from '../profileEditStyles';

interface Props {
  location: UserLocation;
  onToggleDefault: (id: string) => void;
  onEdit: (location: UserLocation) => void;
  onDelete: (id: string) => void;
}

const iconForLabel = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('office') || lower.includes('work')) {
    return 'briefcase-outline';
  }
  return 'home-outline';
};

export const AddressCard = memo<Props>(({ location, onToggleDefault, onEdit, onDelete }) => (
  <View style={peStyles.addressCard}>
    <View style={peStyles.addressTop}>
      <View style={peStyles.addressLabelRow}>
        <Icon name={iconForLabel(location.label)} size={18} color="#111827" />
        <Text style={peStyles.addressLabel}>{location.label}</Text>
      </View>
      <Switch
        value={location.isDefault}
        onValueChange={() => onToggleDefault(location.id)}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={location.isDefault ? '#2563EB' : '#F9FAFB'}
        accessibilityLabel={`Set ${location.label} as default`}
      />
    </View>
    <Text style={peStyles.addressText}>{location.fullAddress}</Text>
    <View style={peStyles.addressActions}>
      <Pressable onPress={() => onEdit(location)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Edit</Text>
      </Pressable>
      <Pressable onPress={() => onDelete(location.id)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Delete</Text>
      </Pressable>
    </View>
  </View>
));

AddressCard.displayName = 'AddressCard';
