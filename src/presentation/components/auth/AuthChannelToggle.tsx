import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { loginScreenStyles as styles } from '../../screens/auth/loginScreenStyles';

export type AuthTabChannel = 'email' | 'phone';

interface Props {
  value: AuthTabChannel;
  onChange: (channel: AuthTabChannel) => void;
}

export const AuthChannelToggle = memo<Props>(({ value, onChange }) => (
  <View style={styles.channelToggleRow}>
    <Pressable
      style={[styles.channelToggleButton, value === 'phone' && styles.channelToggleButtonActive]}
      onPress={() => onChange('phone')}
      accessibilityRole="button"
      accessibilityState={{ selected: value === 'phone' }}>
      <Text
        style={[styles.channelToggleText, value === 'phone' && styles.channelToggleTextActive]}>
        Phone
      </Text>
    </Pressable>
    <Pressable
      style={[styles.channelToggleButton, value === 'email' && styles.channelToggleButtonActive]}
      onPress={() => onChange('email')}
      accessibilityRole="button"
      accessibilityState={{ selected: value === 'email' }}>
      <Text
        style={[styles.channelToggleText, value === 'email' && styles.channelToggleTextActive]}>
        Email
      </Text>
    </Pressable>
  </View>
));

AuthChannelToggle.displayName = 'AuthChannelToggle';
