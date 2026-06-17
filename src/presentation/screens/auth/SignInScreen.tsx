import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
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
import { debounce } from '../../../utils/debounce';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  continueAsGuest,
  sendOtp,
} from '../../redux/slices/authSlice';
import { AUTH_COLORS, loginScreenStyles as styles } from './loginScreenStyles';
import { SendOtpRequestDTO } from '../../../data/dto/authDto';
import type { RootStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LOGO_WIDTH = wp('54%');
const LOGO_HEIGHT = hp('6.0%');
const TAGLINE_WIDTH = wp('25%');
const TAGLINE_HEIGHT = hp('2.2%');

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
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
  const navigateSignInDebounced = useMemo(
    () =>
      debounce(() => {
        navigation.goBack();
      }, 250),
    [navigation],
  );
  const sendOtpDebounced = useMemo(
    () =>
      debounce((value: string) => {
        if (!isValidEmail(value)) {
          Alert.alert('Invalid email', 'Please enter a valid email address.');
          return;
        }

        /*if (!validatePhone(phone)) {
          Alert.alert('Invalid email', 'Please enter a valid email address.');
          return;
        }*/

        // Create the object to send
        const otpRequest: SendOtpRequestDTO = {
          email: value,
          mobile: '',
          mode: 'login', // signup and login
        };

        /*dispatch(sendOtp(otpRequest)).then(() =>
          navigation.navigate('VerifyOtp'),
        );*/
        dispatch(sendOtp(otpRequest))
          .unwrap()
          .then(() => {
            navigation.navigate('VerifyOtp');
          })
          .catch((apiError: any) => {
            if (apiError?.code === 'USER_ALREADY_EXISTS') {
              Alert.alert('Account Exists', apiError.message, [
                {
                  text: 'Go to Login',
                  onPress: () => navigation.navigate('Login'),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
              return;
            }
            Alert.alert('Error', apiError?.message || 'Failed to send OTP');
          });
      }, 250),
    [dispatch, navigation],
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={[AUTH_COLORS.gradientStart, AUTH_COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSection}
      >
        <SafeAreaView edges={['top']} style={styles.logoWrap}>
          <Animated.View
            entering={FadeIn.duration(600)}
            style={logoAnimatedStyle}
          >
            <AppIcon width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            <View style={{ marginTop: hp('1.2%') }}>
              <AppSubtitle
                width={TAGLINE_WIDTH}
                height={TAGLINE_HEIGHT}
                style={styles.slogan}
              />
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.View
        entering={FadeInDown.delay(120).duration(520)}
        style={styles.cardSection}
      >
        <View style={styles.card}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.welcomeTitle}>Welcome!</Text>
              <Text style={styles.welcomeSubtitle}>
                Secure login with your email and otp
              </Text>

              <Text style={styles.sectionTitle}>Sign In</Text>

              <View
                style={[
                  styles.inputRow,
                  emailFocused && styles.inputRowFocused,
                ]}
              >
                <Icon
                  name="email-outline"
                  size={20}
                  color={AUTH_COLORS.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  placeholder="Enter your email id"
                  placeholderTextColor={AUTH_COLORS.placeholder}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              <AnimatedPressable
                style={[styles.primaryButtonWrap, signInAnimatedStyle]}
                //onPress={onLogin}
                onPress={() => sendOtpDebounced(email)}
                onPressIn={() => {
                  signInScale.value = withSpring(0.97);
                }}
                onPressOut={() => {
                  signInScale.value = withSpring(1);
                }}
                disabled={loading}
              >
                <LinearGradient
                  colors={[AUTH_COLORS.primaryButton, '#1E4DFF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </AnimatedPressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <AnimatedPressable onPress={() => navigateSignInDebounced()}>
                <Text style={styles.registerText}>
                  Don't have an account? Sign Up
                </Text>
              </AnimatedPressable>

              <View style={styles.socialDividerRow}>
                <View style={styles.orLine} />
                <Text style={styles.socialDividerText}>
                  Or sign in using below accounts
                </Text>
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
                  }}
                >
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
                  }}
                >
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
                }}
              >
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
