import React, { memo, useEffect, useState } from 'react';
import { Platform, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'editable' | 'maxLength'> {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export const AddressFieldInput = memo<Props>(
  ({
    value,
    placeholder,
    onChangeText,
    error,
    keyboardType = 'default',
    autoCapitalize = 'words',
    editable = true,
    maxLength,
  }) => {
    const [focused, setFocused] = useState(false);
    const focusProgress = useSharedValue(0);

    useEffect(() => {
      focusProgress.value = withTiming(focused ? 1 : 0, { duration: 180 });
    }, [focused, focusProgress]);

    const animatedStyle = useAnimatedStyle(() => ({
      borderColor: error ? PE_COLORS.error : focused ? PE_COLORS.primary : PE_COLORS.border,
      backgroundColor: focused ? '#FFFFFF' : PE_COLORS.inputBg,
    }));

    return (
      <View style={peStyles.inputWrap}>
        <Animated.View style={[peStyles.addressField, animatedStyle]}>
          <TextInput
            style={{
              fontSize: peStyles.addressField.fontSize,
              color: PE_COLORS.text,
              padding: 0,
              margin: 0,
              ...(Platform.OS === 'android' ? { paddingVertical: 0 } : null),
            }}
            value={value}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={editable}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel={placeholder}
          />
        </Animated.View>
        {error ? <Text style={peStyles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

AddressFieldInput.displayName = 'AddressFieldInput';
