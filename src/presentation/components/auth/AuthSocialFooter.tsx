import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch } from '../../hooks/useRedux';
import { continueAsGuest } from '../../redux/slices/authSlice';
import { loginScreenStyles as styles } from '../../screens/auth/loginScreenStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  mode: 'login' | 'signup';
}

export const AuthSocialFooter: React.FC<Props> = ({ mode }) => {
  const dispatch = useAppDispatch();
  const googleScale = useSharedValue(1);
  const appleScale = useSharedValue(1);
  const guestScale = useSharedValue(1);

  const googleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleScale.value }],
  }));
  const appleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appleScale.value }],
  }));
  const guestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: guestScale.value }],
  }));

  const dividerLabel =
    mode === 'signup' ? 'Or sign up using below accounts' : 'Or sign in using below accounts';

  return (
    <>
      <View style={styles.socialDividerRow}>
        <View style={styles.orLine} />
        <Text style={styles.socialDividerText}>{dividerLabel}</Text>
        <View style={styles.orLine} />
      </View>

      <View style={styles.socialRow}>
        <AnimatedPressable
          style={[styles.socialButton, googleAnimatedStyle]}
          onPress={() => Alert.alert('Mock', 'Google login')}
          onPressIn={() => {
            googleScale.value = withSpring(0.94);
          }}
          onPressOut={() => {
            googleScale.value = withSpring(1);
          }}>
          <Icon name="google" size={26} color="#EA4335" />
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.socialButton, appleAnimatedStyle]}
          onPress={() => Alert.alert('Mock', 'Apple login')}
          onPressIn={() => {
            appleScale.value = withSpring(0.94);
          }}
          onPressOut={() => {
            appleScale.value = withSpring(1);
          }}>
          <Icon name="apple" size={26} color="#111827" />
        </AnimatedPressable>
      </View>

      <AnimatedPressable
        style={[styles.guestButton, guestAnimatedStyle]}
        onPress={() => dispatch(continueAsGuest())}
        onPressIn={() => {
          guestScale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          guestScale.value = withSpring(1);
        }}>
        <Text style={styles.guestText}>Continue as Guest</Text>
        <Text style={[styles.guestText, styles.guestArrow]}>→</Text>
      </AnimatedPressable>
    </>
  );
};
