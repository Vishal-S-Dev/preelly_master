import React, { memo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';

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
  }) => (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionTitle}>Location</Text>
      <TextInput
        value={locateYourItem}
        onChangeText={onLocateYourItemChange}
        placeholder="Locate your item (e.g. Near Marina Mall)"
        placeholderTextColor="#8E8E93"
        style={{
          borderRadius: 12,
          backgroundColor: '#F2F2F7',
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: styles.title.color,
          marginBottom: 10,
        }}
      />
      <TextInput
        value={address}
        onChangeText={onAddressChange}
        placeholder="Building or Street name"
        placeholderTextColor="#8E8E93"
        style={{
          borderRadius: 12,
          backgroundColor: '#F2F2F7',
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: styles.title.color,
          marginBottom: 10,
        }}
      />
      <Text style={[styles.subtitle, { marginBottom: 12 }]}>
        Is the pin in the right location? Tap the map or nudge controls to adjust the spot.
      </Text>
      <Pressable
        onPress={() => onCoordinateChange(latitude + 0.002, longitude)}
        style={{ height: 180, borderRadius: 12, backgroundColor: '#E8EEF5', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="map-marker" size={36} color="#0066CC" />
        <Text style={{ position: 'absolute', bottom: 10, fontSize: 12, color: '#64748B' }}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
      </Pressable>
    </View>
  ),
);

LocationMapPicker.displayName = 'LocationMapPicker';
