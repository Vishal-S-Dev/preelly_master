import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AUTH_COLORS,
  authInputStyles,
} from '../../screens/auth/loginWithPasswordScreenStyles';

interface AuthPremiumInputProps {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  leftIcon: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string | null;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const AuthPremiumInput: React.FC<AuthPremiumInputProps> = ({
  value,
  placeholder,
  onChangeText,
  leftIcon,
  keyboardType = 'default',
  secureTextEntry = false,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  error,
  autoCapitalize = 'none',
}) => {
  const [focused, setFocused] = React.useState(false);
  const focusProgress = useSharedValue(0);

  React.useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, focusProgress]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? AUTH_COLORS.error
      : focusProgress.value > 0.5
        ? AUTH_COLORS.inputBorderFocus
        : AUTH_COLORS.inputBorder,
    backgroundColor: focusProgress.value > 0.5 ? '#FFFFFF' : AUTH_COLORS.inputBg,
  }));

  return (
    <View style={authInputStyles.fieldWrap}>
      <Animated.View
        style={[
          authInputStyles.inputRow,
          animatedBorderStyle,
          error ? authInputStyles.inputRowError : null,
        ]}>
        <Icon
          name={leftIcon}
          size={20}
          color={error ? AUTH_COLORS.error : AUTH_COLORS.icon}
          style={authInputStyles.inputIcon}
        />
        <TextInput
          style={authInputStyles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={AUTH_COLORS.placeholder}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {error ? (
          <Icon
            name="alert-circle"
            size={20}
            color={AUTH_COLORS.error}
            style={authInputStyles.trailingIcon}
          />
        ) : null}
        {showPasswordToggle ? (
          <Pressable
            onPress={onTogglePassword}
            hitSlop={8}
            style={authInputStyles.trailingIcon}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={AUTH_COLORS.icon}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? <Text style={authInputStyles.fieldError}>{error}</Text> : null}
    </View>
  );
};
