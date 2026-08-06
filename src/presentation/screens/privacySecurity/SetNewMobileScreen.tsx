import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import LogoBlue from '../../../../assets/icons/logo_blue.svg';
import { RootStackParamList } from '../../navigation/types';
import { UserApi } from '../../../data/api/UserApi';
import { DEFAULT_COUNTRY_DIAL_CODE, CountryDialCode } from '../../../constants/countryDialCodes';
import { formatAuthPhone, validateLoginPhone } from '../../../utils/authPhoneUtils';
import { getApiErrorMessage } from '../../../utils/apiError';
import { CountryCodeSelect } from '../../components/auth/CountryCodeSelect';
import { loginScreenStyles } from '../auth/loginScreenStyles';
import { OTP_COLORS, verifyOtpStyles as styles } from '../auth/verifyOtpScreenStyles';
import { contactChangeStyles as ccStyles } from './contactChangeStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'SetNewMobile'>;

const LOGO_WIDTH = wp('58%');
const LOGO_HEIGHT = hp('6.5%');

export const SetNewMobileScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(DEFAULT_COUNTRY_DIAL_CODE);

  const onSubmit = async () => {
    const validationError = validateLoginPhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const formatted = formatAuthPhone(selectedCountry, phone);
      await UserApi.requestPhoneChange(
        formatted.phone,
        formatted.phoneCountryCode,
        formatted.phoneCountryIso,
      );
      navigation.navigate('ChangeContactOtp', {
        purpose: 'phone',
        target: formatted.phone,
        phoneCountryCode: formatted.phoneCountryCode,
        phoneCountryIso: formatted.phoneCountryIso,
      });
    } catch (err) {
      Alert.alert('Unable to send code', getApiErrorMessage(err, 'Failed to send verification code'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandSection}>
          <LogoBlue width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        </View>

        <View style={ccStyles.headerSection}>
          <Text style={ccStyles.title}>Set a New Mobile Number</Text>
          <Text style={ccStyles.subtitle}>
            Enter a new mobile number that isn&apos;t already linked to your account.
          </Text>
        </View>

        <View style={[ccStyles.inputRow, focused ? ccStyles.inputRowFocused : null]}>
          <CountryCodeSelect
            value={selectedCountry}
            onChange={setSelectedCountry}
            style={loginScreenStyles.inlineCountryPicker}
            flagStyle={loginScreenStyles.flag}
            codeStyle={loginScreenStyles.inlineCountryCode}
          />
          <Text style={ccStyles.phoneInputDivider}>·</Text>
          <Icon name="phone-outline" size={20} color={OTP_COLORS.placeholder} style={ccStyles.inputIcon} />
          <TextInput
            style={ccStyles.input}
            value={phone}
            onChangeText={text => {
              setPhone(text);
              if (error) {
                setError(validateLoginPhone(text) ?? '');
              }
            }}
            placeholder="Enter your new mobile number"
            placeholderTextColor={OTP_COLORS.placeholder}
            keyboardType="phone-pad"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButtonWrap, ccStyles.submitWrap]}
          onPress={onSubmit}
          disabled={submitting}>
          <LinearGradient
            colors={[OTP_COLORS.primary, OTP_COLORS.primaryGradientEnd]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{submitting ? 'Sending...' : 'Reset Mobile Number'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to Privacy and Security">
          <Text style={ccStyles.backLink}>‹ Back to Privacy and Security</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
