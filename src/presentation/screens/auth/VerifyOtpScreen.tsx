import React, { useEffect, useState } from 'react';
import {
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
import type { RootStackParamList } from '../../navigation/types';
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

export const VerifyOtpScreen: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);
  const email = useAppSelector(state => state.auth.emailForOtp);
  const lastOtpRequest = useAppSelector(state => state.auth.lastOtpRequest);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'VerifyOtp'>>();

  const verifyScale = useSharedValue(1);
  const logoScale = useSharedValue(0.9);

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

  const onVerify = () => {
    dispatch(verifyOtp({ email, otp }))
      .unwrap()
      .catch(() => {
        // error is already reflected through redux `error` state
      });
  };

  const onResend = () => {
    if (secondsLeft > 0 || !email) {
      return;
    }
    if (lastOtpRequest) {
      dispatch(sendOtp(lastOtpRequest));
    } else {
      dispatch(sendOtp({ email, mobile: '', mode: 'login' }));
    }
    setSecondsLeft(RESEND_COOLDOWN_SEC);
  };

  const onChangeEmail = () => {
    navigation.goBack();
  };

  const displayEmail = email || 'your email';

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
           {/* <Text style={{ marginTop: hp('0.8%'), fontSize: wp('3.4%'), fontWeight: '600', color: OTP_COLORS.tagline }}>
              Buy. Sell. Watch.
            </Text>*/}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(480)} style={styles.headerSection}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Enter the code we have sent you to your email id{' '}
              <Text style={styles.emailBold}>{displayEmail}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.illustrationWrap}>
            <OtpIllustration width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <OtpDigitBoxes value={otp} onChange={setOtp} />
          </Animated.View>

          <View style={styles.resendWrap}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendText}>
                Resend code in <Text style={styles.resendTimer}>{secondsLeft}s</Text>
              </Text>
            ) : (
              <Pressable onPress={onResend} disabled={loading || !email}>
                <Text style={styles.resendActive}>Resend code</Text>
              </Pressable>
            )}
          </View>

          {/*<Text style={styles.helperText}>Enter 123456 for mock login</Text>*/}

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
            disabled={loading}>
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
            <Text style={styles.bottomMuted}>Not your email id?</Text>
            <Text style={styles.bottomEmail}>{displayEmail}</Text>
            <Pressable onPress={onChangeEmail}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
