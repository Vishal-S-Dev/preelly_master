import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const AppButton: React.FC<Props> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const theme = useAppTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginVertical: 6,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
