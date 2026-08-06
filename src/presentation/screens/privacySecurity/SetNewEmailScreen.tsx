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
import { isValidAuthEmail } from '../../../utils/authPhoneUtils';
import { getApiErrorMessage } from '../../../utils/apiError';
import { OTP_COLORS, verifyOtpStyles as styles } from '../auth/verifyOtpScreenStyles';
import { contactChangeStyles as ccStyles } from './contactChangeStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'SetNewEmail'>;

const LOGO_WIDTH = wp('58%');
const LOGO_HEIGHT = hp('6.5%');

export const SetNewEmailScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!isValidAuthEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await UserApi.requestEmailChange(trimmed);
      navigation.navigate('ChangeContactOtp', { purpose: 'email', target: trimmed });
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
          <Text style={ccStyles.title}>Set a New Email ID</Text>
          <Text style={ccStyles.subtitle}>
            Enter a new email address that isn&apos;t already linked to your account.
          </Text>
        </View>

        <View style={[ccStyles.inputRow, focused ? ccStyles.inputRowFocused : null]}>
          <Icon name="email-outline" size={20} color={OTP_COLORS.placeholder} style={ccStyles.inputIcon} />
          <TextInput
            style={ccStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your new mail ID"
            placeholderTextColor={OTP_COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
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
            <Text style={styles.primaryButtonText}>{submitting ? 'Sending...' : 'Reset Mail ID'}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to Privacy and Security">
          <Text style={ccStyles.backLink}>‹ Back to Privacy and Security</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
