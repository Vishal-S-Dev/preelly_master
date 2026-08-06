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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoBlue from '../../../../assets/icons/logo_blue.svg';
import OtpIllustration from '../../../../assets/icons/otp.svg';
import { RootStackParamList } from '../../navigation/types';
import { OtpDigitBoxes } from '../../components/auth/OtpDigitBoxes';
import { UserApi } from '../../../data/api/UserApi';
import { formatDisplayPhone } from '../../../utils/authPhoneUtils';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useAppDispatch } from '../../hooks/useRedux';
import { updateAuthUser } from '../../redux/slices/authSlice';
import { OTP_COLORS, verifyOtpStyles as styles } from '../auth/verifyOtpScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangeContactOtp'>;

const LOGO_WIDTH = wp('80%');
const LOGO_HEIGHT = hp('9.5%');
const ILLUSTRATION_WIDTH = wp('72%');
const ILLUSTRATION_HEIGHT = hp('22%');
const RESEND_COOLDOWN_SEC = 59;
const OTP_LENGTH = 6;

export const ChangeContactOtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { purpose, target, phoneCountryCode, phoneCountryIso } = route.params;
  const dispatch = useAppDispatch();
  const isPhone = purpose === 'phone';

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);

  const displayTarget = useMemo(
    () => (isPhone ? formatDisplayPhone(phoneCountryCode ?? '+971', target) : target),
    [isPhone, phoneCountryCode, target],
  );

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const onResend = async () => {
    if (secondsLeft > 0 || resending) {
      return;
    }
    setResending(true);
    try {
      if (isPhone) {
        await UserApi.requestPhoneChange(target, phoneCountryCode, phoneCountryIso);
      } else {
        await UserApi.requestEmailChange(target);
      }
      setOtp('');
      setOtpError('');
      setSecondsLeft(RESEND_COOLDOWN_SEC);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to resend code'));
    } finally {
      setResending(false);
    }
  };

  const onVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpError('');
    setVerifying(true);
    try {
      if (isPhone) {
        const result = await UserApi.verifyPhoneChange(target, otp, phoneCountryCode, phoneCountryIso);
        dispatch(updateAuthUser({ phone: result.phone, isPhoneVerified: result.isPhoneVerified }));
      } else {
        const result = await UserApi.verifyEmailChange(target, otp);
        dispatch(updateAuthUser({ email: result.email, isEmailVerified: result.isEmailVerified }));
      }
      Alert.alert(
        isPhone ? 'Mobile number updated' : 'Email updated',
        'Your changes have been saved.',
        [{ text: 'OK', onPress: () => navigation.navigate('PrivacySecurity') }],
      );
    } catch (err) {
      Alert.alert('Verification failed', getApiErrorMessage(err, 'Please try again.'));
    } finally {
      setVerifying(false);
    }
  };

  const resendLabel = isPhone ? 'Resend Otp' : 'Resend Code';
  const notYourLabel = isPhone ? 'Not your phone number?' : 'Not your email id?';
  const didntReceiveLabel = isPhone ? "Didn't receive the otp yet?" : "Didn't receive the code yet?";

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
          <View style={styles.brandSection}>
            <LogoBlue width={LOGO_WIDTH} height={LOGO_HEIGHT} />
          </View>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Enter the code we have sent you to your {isPhone ? 'phone number ' : 'email id '}
              <Text style={styles.emailBold}>{displayTarget}</Text>
            </Text>
          </View>

          <View style={styles.illustrationWrap}>
            <OtpIllustration width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT} />
          </View>

          <OtpDigitBoxes
            value={otp}
            onChange={value => {
              setOtp(value);
              if (otpError) {
                setOtpError('');
              }
            }}
          />

          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

          <View style={styles.resendWrap}>
            {secondsLeft > 0 ? (
              <Text style={styles.resendText}>
                Resend otp in <Text style={styles.resendTimer}>{secondsLeft}s</Text>
              </Text>
            ) : (
              <>
                <Text style={styles.resendPrompt}>{didntReceiveLabel}</Text>
                <Pressable onPress={onResend} disabled={resending} style={{ marginTop: 6 }}>
                  <Text style={styles.resendActive}>{resendLabel}</Text>
                </Pressable>
              </>
            )}
          </View>

          <Pressable
            style={styles.primaryButtonWrap}
            onPress={onVerify}
            disabled={verifying || otp.length < OTP_LENGTH}>
            <LinearGradient
              colors={[OTP_COLORS.primary, OTP_COLORS.primaryGradientEnd]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{verifying ? 'Verifying...' : 'Verify Now'}</Text>
            </LinearGradient>
          </Pressable>

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
