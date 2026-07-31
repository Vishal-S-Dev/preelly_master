import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProp } from '@react-navigation/native-stack';
import { isValidAuthEmail } from '../../../utils/authPhoneUtils';
import { debounce } from '../../../utils/debounce';
import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { clearAuthJourney, sendOtp } from '../../redux/slices/authSlice';
import { AUTH_COLORS, loginScreenStyles as styles } from './loginScreenStyles';
import { SendOtpRequestDTO } from '../../../data/dto/authDto';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProp<RootStackParamList, 'AuthLinkEmail'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AuthLinkEmailScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const submitScale = useSharedValue(1);
  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const onVerify = useMemo(
    () =>
      debounce(() => {
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
            Alert.alert('Error', apiError?.message || 'Failed to send verification code');
          });
      }, 250),
    [dispatch, email, navigation],
  );

  const onSkip = () => {
    dispatch(clearAuthJourney());
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.welcomeTitle}>Enter Email id</Text>
      <Text style={styles.welcomeSubtitle}>
        Enter your email id to link with your account
      </Text>

      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Icon name="email-outline" size={20} color={AUTH_COLORS.icon} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={email}
          placeholder="Enter your new mail ID"
          placeholderTextColor={AUTH_COLORS.placeholder}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

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
