import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProp } from '@react-navigation/native-stack';
import { DEFAULT_COUNTRY_DIAL_CODE, CountryDialCode } from '../../../constants/countryDialCodes';
import { formatAuthPhone, validateLoginPhone } from '../../../utils/authPhoneUtils';
import { debounce } from '../../../utils/debounce';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { CountryCodeSelect } from '../../components/auth/CountryCodeSelect';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { clearAuthJourney, sendOtp } from '../../redux/slices/authSlice';
import { AUTH_COLORS, loginScreenStyles as styles } from './loginScreenStyles';
import { SendOtpRequestDTO } from '../../../data/dto/authDto';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProp<RootStackParamList, 'AuthLinkPhone'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AuthLinkPhoneScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryDialCode>(DEFAULT_COUNTRY_DIAL_CODE);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const submitScale = useSharedValue(1);
  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const onVerify = useMemo(
    () =>
      debounce(() => {
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
      }, 250),
    [dispatch, navigation, phone, selectedCountry],
  );

  const onSkip = () => {
    dispatch(clearAuthJourney());
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.welcomeTitle}>Enter Phone No.</Text>
      <Text style={styles.welcomeSubtitle}>
        Enter your phone no. to link with your account
      </Text>

      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <CountryCodeSelect
          value={selectedCountry}
          onChange={setSelectedCountry}
          style={styles.inlineCountryPicker}
          flagStyle={styles.flag}
          codeStyle={styles.inlineCountryCode}
        />
        <Text style={styles.phoneInputDivider}>·</Text>
        <Icon name="phone-outline" size={20} color={AUTH_COLORS.icon} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your phone no."
          placeholderTextColor={AUTH_COLORS.placeholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            if (phoneError) {
              setPhoneError(validateLoginPhone(text) ?? '');
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {phoneError ? (
        <Text style={{ color: AUTH_COLORS.error, marginTop: -4, marginBottom: 8 }}>{phoneError}</Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AnimatedPressable
        style={[styles.primaryButtonWrap, submitAnimatedStyle]}
        onPress={() => onVerify()}
        onPressIn={() => {
          submitScale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          submitScale.value = withSpring(1);
        }}
        disabled={loading}>
        <LinearGradient
          colors={[AUTH_COLORS.primaryButton, '#1E4DFF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Please wait...' : 'Verify Now'}
          </Text>
        </LinearGradient>
      </AnimatedPressable>

      <Pressable onPress={onSkip} style={{ marginTop: 16, alignSelf: 'center' }}>
        <Text style={styles.registerText}>Skip</Text>
      </Pressable>
    </AuthScreenLayout>
  );
};
