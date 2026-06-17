import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GenderOption } from '../../../../../types/profileEdit.types';
import { peStyles } from '../profileEditStyles';

const OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface Props {
  value: GenderOption;
  onChange: (value: GenderOption) => void;
  hidePreferNotToSay?: boolean;
  error?: string;
}

export const GenderRadioGroup = memo<Props>(({ value, onChange, hidePreferNotToSay, error }) => {
  const visibleOptions = hidePreferNotToSay
    ? OPTIONS.filter(option => option.value !== 'prefer_not_to_say')
    : OPTIONS;

  return (
  <View>
    {visibleOptions.map(option => {
      const selected = value === option.value;
      return (
        <Pressable
          key={option.value}
          style={peStyles.radioRow}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected }}>
          <View style={[peStyles.radioOuter, selected ? peStyles.radioOuterActive : null]}>
            {selected ? (
              <Animated.View entering={FadeIn.duration(160)} style={peStyles.radioInner} />
            ) : null}
          </View>
          <Text style={peStyles.radioLabel}>{option.label}</Text>
        </Pressable>
      );
    })}
    {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>{error}</Text> : null}
  </View>
  );
});

GenderRadioGroup.displayName = 'GenderRadioGroup';
