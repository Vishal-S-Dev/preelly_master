import React, { memo, useMemo } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { PE_COLORS, peStyles } from '../profileEditStyles';

const PRESET_LABELS = ['Home', 'Office', 'Home 2'];

interface Props {
  value: string;
  onChange: (value: string) => void;
  customLabel: string;
  onCustomLabelChange: (value: string) => void;
  showCustomInput: boolean;
  onShowCustomInput: () => void;
}

export const AddressLabelChips = memo<Props>(
  ({ value, onChange, customLabel, onCustomLabelChange, showCustomInput, onShowCustomInput }) => {
    const chips = useMemo(() => {
      const extras = value && !PRESET_LABELS.includes(value) ? [value] : [];
      return [...PRESET_LABELS, ...extras];
    }, [value]);

    return (
      <View>
        <Text style={[peStyles.sectionTitle, { marginTop: 0, marginBottom: 12 }]}>
          Choose how you want to label your location{' '}
          <Text style={{ color: PE_COLORS.error }}>*</Text>
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 8 }}
          keyboardShouldPersistTaps="handled">
          {chips.map(item => {
            const selected = value === item;
            return (
              <Pressable
                key={item}
                onPress={() => onChange(item)}
                style={[peStyles.labelChip, selected ? peStyles.labelChipActive : null]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}>
                <Text style={[peStyles.labelChipText, selected ? peStyles.labelChipTextActive : null]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onShowCustomInput}
            style={peStyles.labelChipCustom}
            accessibilityRole="button"
            accessibilityLabel="Add custom label">
            <Text style={peStyles.labelChipCustomText}>Add Custom Label</Text>
          </Pressable>
        </ScrollView>

        {showCustomInput ? (
          <TextInput
            value={customLabel}
            onChangeText={next => {
              onCustomLabelChange(next);
              if (next.trim()) {
                onChange(next.trim());
              }
            }}
            placeholder="Enter custom label"
            placeholderTextColor="#9CA3AF"
            autoFocus
            style={[peStyles.addressField, { marginTop: 12 }]}
            accessibilityLabel="Custom location label"
          />
        ) : null}
      </View>
    );
  },
);

AddressLabelChips.displayName = 'AddressLabelChips';
