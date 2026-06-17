import React, { memo, useEffect, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'editable'> {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  leftIcon?: string;
  rightIcon?: string;
  onPressRight?: () => void;
  error?: string;
  onPress?: () => void;
  editable?: boolean;
}

export const ProfileEditInput = memo<Props>(
  ({
    value,
    placeholder,
    onChangeText,
    leftIcon = 'account-outline',
    rightIcon,
    onPressRight,
    error,
    keyboardType = 'default',
    autoCapitalize = 'words',
    editable = true,
    onPress,
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

    const content = (
      <Animated.View style={[peStyles.inputShell, animatedStyle]}>
        <Icon name={leftIcon} size={20} color={error ? PE_COLORS.error : '#9CA3AF'} />
        <TextInput
          style={peStyles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable && !onPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={placeholder}
        />
        {rightIcon ? (
          <Icon
            name={rightIcon}
            size={22}
            color={PE_COLORS.primary}
            onPress={onPressRight}
            accessibilityRole="button"
          />
        ) : null}
      </Animated.View>
    );

    return (
      <View style={peStyles.inputWrap}>
        {onPress ? (
          <Text onPress={onPress} accessibilityRole="button">
            {content}
          </Text>
        ) : (
          content
        )}
        {error ? <Text style={peStyles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

ProfileEditInput.displayName = 'ProfileEditInput';
