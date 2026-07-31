import React, { useEffect, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import LogoBlue from '../../../../assets/icons/logo_blue.svg';
import OtpIllustration from '../../../../assets/icons/otp.svg';
import { OtpDigitBoxes } from '../../components/auth/OtpDigitBoxes';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { sendOtp, verifyOtp } from '../../redux/slices/authSlice';
import { useAuthJourneyNavigation } from '../../hooks/useAuthJourneyNavigation';
import { store } from '../../redux/store';
import type { RootStackParamList } from '../../navigation/types';
import { VerifyOtpRequestDto } from '../../../data/dto/authDto';
import { formatDisplayPhone } from '../../../utils/authPhoneUtils';
import {
  OTP_COLORS,
  verifyOtpStyles as styles,
} from './verifyOtpScreenStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LOGO_WIDTH = wp('80%');
const LOGO_HEIGHT = hp('9.5%');
const ILLUSTRATION_WIDTH = wp('72%');
const ILLUSTRATION_HEIGHT = hp('22%');
const RESEND_COOLDOWN_SEC = 59;
const OTP_LENGTH = 6;

export const VerifyOtpScreen: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);
  const otpSession = useAppSelector(state => state.auth.otpSession);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const { navigateAfterOtpVerify } = useAuthJourneyNavigation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'VerifyOtp'>>();

  const verifyScale = useSharedValue(1);
  const logoScale = useSharedValue(0.9);

  const isPhoneChannel = otpSession?.channel === 'whatsapp';

  const displayTarget = useMemo(() => {
    if (isPhoneChannel && otpSession?.phone) {
      return formatDisplayPhone(
        otpSession.phoneCountryCode ?? '+971',
        otpSession.phone,
      );
    }
    return otpSession?.email ?? 'your email';
  }, [isPhoneChannel, otpSession]);

  useEffect(() => {
    if (!otpSession) {
      navigation.goBack();
    }
  }, [navigation, otpSession]);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [logoScale]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const verifyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: verifyScale.value }],
  }));

  const buildVerifyPayload = (): VerifyOtpRequestDto | null => {
    if (!otpSession) {
      return null;
    }

    const base: VerifyOtpRequestDto = {
      otp,
      mode: otpSession.mode,
      channel: otpSession.channel ?? 'email',
    };

    if (isPhoneChannel) {
      return {
        ...base,
        phone: otpSession.phone,
        phoneCountryCode: otpSession.phoneCountryCode,
        phoneCountryIso: otpSession.phoneCountryIso,
      };
    }

    return {
      ...base,
      email: otpSession.email,
      phone: otpSession.phone,
      phoneCountryCode: otpSession.phoneCountryCode,
      phoneCountryIso: otpSession.phoneCountryIso,
    };
  };

  const onVerify = () => {
    setAlreadyRegistered(false);

    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpError('');

    const payload = buildVerifyPayload();
    if (!payload) {
      return;
    }

    dispatch(verifyOtp(payload))
      .unwrap()
      .then(result => {
        if (result.kind === 'verification_required') {
          navigation.navigate(
            result.nextStep === 'phone' ? 'AuthLinkPhone' : 'AuthLinkEmail',
          );
          return;
        }
        const { authJourney } = store.getState().auth;
        navigateAfterOtpVerify(navigation, authJourney);
      })
      .catch((apiError: { code?: string; message?: string }) => {
        if (apiError?.code === 'USER_ALREADY_EXISTS') {
          setAlreadyRegistered(true);
          return;
        }
        Alert.alert('Verification failed', apiError?.message || 'Please try again.');
      });
  };

  const onResend = () => {
    if (secondsLeft > 0 || !otpSession) {
      return;
    }

    dispatch(sendOtp(otpSession))
      .unwrap()
      .then(() => {
        setOtp('');
        setOtpError('');
        setSecondsLeft(RESEND_COOLDOWN_SEC);
      })
      .catch((apiError: { message?: string }) => {
        Alert.alert('Error', apiError?.message || 'Failed to resend OTP');
      });
  };

  if (!otpSession) {
    return null;
  }

  const resendLabel = isPhoneChannel ? 'Resend Otp' : 'Resend Code';
  const notYourLabel = isPhoneChannel ? 'Not your phone number?' : 'Not your email id?';
  const didntReceiveLabel = isPhoneChannel
    ? "Didn't receive the otp yet?"
    : "Didn't receive the code yet?";

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={OTP_COLORS.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandSection}>
            <Animated.View style={logoAnimatedStyle}>
              <LogoBlue width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(480)} style={styles.headerSection}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Enter the code we have sent you to your{' '}
              {isPhoneChannel ? 'phone number ' : 'email id '}
              <Text style={styles.emailBold}>{displayTarget}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.illustrationWrap}>
            <OtpIllustration width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT} />
          </Animated.View>

          {alreadyRegistered ? (
            <View style={styles.alreadyRegisteredBanner}>
              <Text style={styles.alreadyRegisteredText}>
                An account with this email already exists. Please go back and sign in.
              </Text>
            </View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <OtpDigitBoxes
              value={otp}
              onChange={value => {
                setOtp(value);
                if (otpError) {
                  setOtpError('');
                }
              }}
            />
          </Animated.View>

          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

          <View style={styles.resendWrap}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendText}>
                Resend otp in <Text style={styles.resendTimer}>{secondsLeft}s</Text>
              </Text>
            ) : (
              <>
                <Text style={styles.resendPrompt}>{didntReceiveLabel}</Text>
                <Pressable onPress={onResend} disabled={loading} style={{ marginTop: 6 }}>
                  <Text style={styles.resendActive}>{resendLabel}</Text>
                </Pressable>
              </>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AnimatedPressable
            style={[styles.primaryButtonWrap, verifyAnimatedStyle]}
            onPress={onVerify}
            onPressIn={() => {
              verifyScale.value = withSpring(0.97);
            }}
            onPressOut={() => {
              verifyScale.value = withSpring(1);
            }}
            disabled={loading || otp.length < OTP_LENGTH}>
            <LinearGradient
              colors={[OTP_COLORS.primary, OTP_COLORS.primaryGradientEnd]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Verifying...' : 'Verify Now'}
              </Text>
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.bottomSection}>
            <Text style={styles.bottomMuted}>{notYourLabel}</Text>
            <Text style={styles.bottomEmail}>{displayTarget}</Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
