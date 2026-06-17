import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export const AppInput: React.FC<Props> = ({
  value,
  placeholder,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) => {
  const theme = useAppTheme();
  return (
    <TextInput
      style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
      placeholder={placeholder}
      placeholderTextColor={theme.subText}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  );
};

const styles = StyleSheet.create({
  input: { padding: 14, borderRadius: 10, marginBottom: 12 },
});
