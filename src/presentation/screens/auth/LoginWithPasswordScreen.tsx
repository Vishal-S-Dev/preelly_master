import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppIcon from '../../../../assets/icons/app_icon.svg';
import AppSubtitle from '../../../../assets/icons/app_sub_title.svg';
import { AuthPremiumInput } from '../../components/auth/AuthPremiumInput';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { continueAsGuest, loginUser } from '../../redux/slices/authSlice';
import {
  AUTH_COLORS,
  loginWithPasswordStyles as styles,
} from './loginWithPasswordScreenStyles';

interface Props {
  navigation?: { navigate: (screen: string) => void };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LOGO_WIDTH = wp('54%');
const LOGO_HEIGHT = hp('6%');
const TAGLINE_WIDTH = wp('36%');
const TAGLINE_HEIGHT = hp('2.2%');

export const LoginWithPasswordScreen: React.FC<Props> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);

  const signInScale = useSharedValue(1);
  const googleScale = useSharedValue(1);
  const appleScale = useSharedValue(1);
  const guestScale = useSharedValue(1);
  const logoScale = useSharedValue(0.88);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [logoScale]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const signInAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signInScale.value }],
  }));

  const googleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleScale.value }],
  }));

  const appleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appleScale.value }],
  }));

  const guestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: guestScale.value }],
  }));

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const onLogin = () => {
    let hasError = false;

    if (!isValidEmail(email)) {
      setEmailFieldError('Error: Invalid email or mobile number');
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      hasError = true;
    } else {
      setEmailFieldError(null);
    }

    if (password.trim().length < 6) {
      setPasswordFieldError('Error: Incorrect password');
      Alert.alert('Invalid password', 'Password must be at least 6 characters.');
      hasError = true;
    } else {
      setPasswordFieldError(null);
    }

    if (hasError) {
      return;
    }

    dispatch(loginUser({ email: email.trim(), password: password.trim() }));
  };

  const onForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password recovery is not configured yet.');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[AUTH_COLORS.gradientStart, AUTH_COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSection}>
        <SafeAreaView edges={['top']} style={styles.logoWrap}>
          <Animated.View entering={FadeIn.duration(600)} style={logoAnimatedStyle}>
            <AppIcon width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            <View style={{ marginTop: hp('1.2%') }}>
              <AppSubtitle width={TAGLINE_WIDTH} height={TAGLINE_HEIGHT} />
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(120).duration(520)} style={styles.cardSection}>
        <View style={styles.card}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Secure login with your email and password
              </Text>

              <Text style={styles.sectionTitle}>Login With Password</Text>

              <AuthPremiumInput
                value={email}
                placeholder="Enter your email or mobile"
                onChangeText={value => {
                  setEmail(value);
                  if (emailFieldError) {
                    setEmailFieldError(null);
                  }
                }}
                leftIcon="email-outline"
                keyboardType="email-address"
                error={emailFieldError}
              />

              <AuthPremiumInput
                value={password}
                placeholder="Enter your password"
                onChangeText={value => {
                  setPassword(value);
                  if (passwordFieldError) {
                    setPasswordFieldError(null);
                  }
                }}
                leftIcon="lock-outline"
                secureTextEntry
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(prev => !prev)}
                error={passwordFieldError}
              />

              <Pressable style={styles.forgotPasswordRow} onPress={onForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              <AnimatedPressable
                style={[styles.primaryButtonWrap, signInAnimatedStyle]}
                onPress={onLogin}
                onPressIn={() => {
                  signInScale.value = withSpring(0.97);
                }}
                onPressOut={() => {
                  signInScale.value = withSpring(1);
                }}
                disabled={loading}>
                <LinearGradient
                  colors={[AUTH_COLORS.primaryButton, '#1E4DFF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Logging in...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </AnimatedPressable>

              {error && !emailFieldError && !passwordFieldError ? (
                <Text style={styles.apiErrorText}>{error}</Text>
              ) : null}

              <View style={styles.socialDividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.socialDividerText}>
                  Or sign up using below accounts
                </Text>
                <View style={styles.dividerLine} />
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
                <Icon
                  name="arrow-right"
                  size={18}
                  color={AUTH_COLORS.guestText}
                  style={{ marginLeft: 6 }}
                />
              </AnimatedPressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </View>
  );
};
