import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { ENV } from '../../../constants/env';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useAppDispatch } from '../../hooks/useRedux';
import { continueAsGuest, signInWithApple, signInWithGoogle } from '../../redux/slices/authSlice';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGooglePress = useCallback(async () => {
    if (googleLoading) {
      return;
    }
    if (!ENV.GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Google sign-in unavailable',
        'Google sign-in is not configured for this build yet.',
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) {
        return;
      }
      await dispatch(signInWithGoogle(response.data.idToken)).unwrap();
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) {
        return;
      }
      Alert.alert('Google sign-in failed', getApiErrorMessage(error, 'Unable to sign in with Google.'));
    } finally {
      setGoogleLoading(false);
    }
  }, [dispatch, googleLoading]);

  const handleApplePress = useCallback(async () => {
    if (appleLoading) {
      return;
    }
    if (Platform.OS !== 'ios' || !appleAuth.isSupported) {
      Alert.alert(
        'Apple sign-in unavailable',
        'Sign in with Apple is only available on supported iOS devices.',
      );
      return;
    }

    setAppleLoading(true);
    try {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      if (!response.identityToken || !response.authorizationCode) {
        throw new Error('Apple did not return the required credentials.');
      }

      // Apple only shares name/email on the FIRST authorization for this app — omit
      // whichever fields it withholds on later sign-ins rather than sending empty strings.
      const fullName = [response.fullName?.givenName, response.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const user =
        fullName || response.email
          ? { name: fullName || undefined, email: response.email || undefined }
          : undefined;

      await dispatch(
        signInWithApple({
          identityToken: response.identityToken,
          authorizationCode: response.authorizationCode,
          user,
        }),
      ).unwrap();
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      if (code === appleAuth.Error.CANCELED) {
        return;
      }
      Alert.alert('Apple sign-in failed', getApiErrorMessage(error, 'Unable to sign in with Apple.'));
    } finally {
      setAppleLoading(false);
    }
  }, [appleLoading, dispatch]);

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
          onPress={handleGooglePress}
          disabled={googleLoading}
          onPressIn={() => {
            googleScale.value = withSpring(0.94);
          }}
          onPressOut={() => {
            googleScale.value = withSpring(1);
          }}>
          {googleLoading ? (
            <ActivityIndicator size="small" color="#EA4335" />
          ) : (
            <Icon name="google" size={26} color="#EA4335" />
          )}
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.socialButton, appleAnimatedStyle]}
          onPress={handleApplePress}
          disabled={appleLoading}
          onPressIn={() => {
            appleScale.value = withSpring(0.94);
          }}
          onPressOut={() => {
            appleScale.value = withSpring(1);
          }}>
          {appleLoading ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Icon name="apple" size={26} color="#111827" />
          )}
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
