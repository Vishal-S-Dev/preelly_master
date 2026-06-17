import React, { memo } from 'react';
import { Text, TextInput, View } from 'react-native';
import { cpStyles } from './createPostStyles';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}

export const AppInput = memo<Props>(
  ({ label, value, onChangeText, multiline, required, placeholder }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={cpStyles.inputLabel}>
        {label}
        {required ? '*' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        style={[cpStyles.input, multiline && cpStyles.textarea]}
      />
    </View>
  ),
);

AppInput.displayName = 'AppInput';
