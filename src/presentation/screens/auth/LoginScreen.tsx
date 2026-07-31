import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DEFAULT_COUNTRY_DIAL_CODE, CountryDialCode } from '../../../constants/countryDialCodes';
import {
  formatAuthPhone,
  isValidAuthEmail,
  validateLoginPhone,
} from '../../../utils/authPhoneUtils';
import { debounce } from '../../../utils/debounce';
import { AuthChannelToggle, AuthTabChannel } from '../../components/auth/AuthChannelToggle';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { AuthSocialFooter } from '../../components/auth/AuthSocialFooter';
import { CountryCodeSelect } from '../../components/auth/CountryCodeSelect';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { sendOtp } from '../../redux/slices/authSlice';
import { AUTH_COLORS, loginScreenStyles as styles } from './loginScreenStyles';
import { SendOtpRequestDTO } from '../../../data/dto/authDto';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Unified authentication entry — login and signup share this screen.
 * Backend decides existing vs new user from OTP APIs (`mode: login`).
 */
export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [tab, setTab] = useState<AuthTabChannel>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryDialCode>(DEFAULT_COUNTRY_DIAL_CODE);
  const dispatch = useAppDispatch();
  const { loading, error, authJourney } = useAppSelector(state => state.auth);
  const submitScale = useSharedValue(1);
  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  useEffect(() => {
    if (authJourney?.step === 'link_phone') {
      navigation.navigate('AuthLinkPhone');
    } else if (authJourney?.step === 'link_email') {
      navigation.navigate('AuthLinkEmail');
    }
  }, [authJourney, navigation]);

  const sendOtpDebounced = useMemo(
    () =>
      debounce(() => {
        if (tab === 'phone') {
          const phoneValidationError = validateLoginPhone(phone);
          if (phoneValidationError) {
            setPhoneError(phoneValidationError);
            return;
          }
          setPhoneError('');

          const formattedPhone = formatAuthPhone(selectedCountry, phone);
          const otpRequest: SendOtpRequestDTO = {
            mode: 'login',
            channel: 'whatsapp',
            phone: formattedPhone.phone,
            phoneCountryCode: formattedPhone.phoneCountryCode,
            phoneCountryIso: formattedPhone.phoneCountryIso,
          };

          dispatch(sendOtp(otpRequest))
            .unwrap()
            .then(() => navigation.navigate('VerifyOtp'))
            .catch((apiError: { message?: string }) => {
              Alert.alert('Error', apiError?.message || 'Failed to send OTP');
            });
          return;
        }

        if (!isValidAuthEmail(email)) {
          Alert.alert('Invalid email', 'Please enter a valid email address.');
          return;
        }

        const otpRequest: SendOtpRequestDTO = {
          email: email.trim(),
          mode: 'login',
          channel: 'email',
        };

        dispatch(sendOtp(otpRequest))
          .unwrap()
          .then(() => navigation.navigate('VerifyOtp'))
          .catch((apiError: { message?: string }) => {
            Alert.alert('Error', apiError?.message || 'Failed to send OTP');
          });
      }, 250),
    [dispatch, email, navigation, phone, selectedCountry, tab],
  );

  const welcomeSubtitle =
    tab === 'phone'
      ? 'Secure login with your phone number'
      : 'Secure login with your email address';
  const loginButtonLabel =
    tab === 'phone' ? 'Continue with WhatsApp' : 'Continue with Email';

  return (
    <AuthScreenLayout>
      <Text style={styles.welcomeTitle}>Welcome!</Text>
      <Text style={styles.welcomeSubtitle}>{welcomeSubtitle}</Text>

      <AuthChannelToggle value={tab} onChange={setTab} />

      {tab === 'email' ? (
        <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
          <Icon name="email-outline" size={20} color={AUTH_COLORS.icon} style={styles.inputIcon} />
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
      ) : (
        <>
          <View style={[styles.inputRow, mobileFocused && styles.inputRowFocused]}>
            <CountryCodeSelect
              compact
              value={selectedCountry}
              onChange={setSelectedCountry}
              style={styles.inlineCountryPicker}
              flagStyle={styles.flag}
            />
            <Text style={styles.phoneInputDivider}>{selectedCountry.dialCode} ·</Text>
            <TextInput
              style={styles.input}
              placeholder="Mobile number"
              placeholderTextColor={AUTH_COLORS.placeholder}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={text => {
                setPhone(text);
                if (phoneError) {
                  setPhoneError(validateLoginPhone(text) ?? '');
                }
              }}
              onFocus={() => setMobileFocused(true)}
              onBlur={() => setMobileFocused(false)}
            />
          </View>
          {phoneError ? (
            <Text style={{ color: AUTH_COLORS.error, marginTop: -4, marginBottom: 8 }}>
              {phoneError}
            </Text>
          ) : null}
        </>
      )}

      <AnimatedPressable
        style={[styles.primaryButtonWrap, submitAnimatedStyle]}
        onPress={() => sendOtpDebounced()}
        onPressIn={() => {
          submitScale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          submitScale.value = withSpring(1);
        }}
        disabled={loading}>
        <LinearGradient
          colors={[AUTH_COLORS.primaryButton, AUTH_COLORS.primaryButtonEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Please wait...' : loginButtonLabel}
          </Text>
        </LinearGradient>
      </AnimatedPressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AuthSocialFooter mode="login" />
    </AuthScreenLayout>
  );
};
