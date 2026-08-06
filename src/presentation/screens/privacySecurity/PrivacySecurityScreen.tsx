import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { UserApi } from '../../../data/api/UserApi';
import { UserProfileDTO } from '../../../types/userProfile.types';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useAppSelector } from '../../hooks/useRedux';
import { useBiometrics } from '../../hooks/useBiometrics';
import { ProfileEditInput } from '../profile/edit/components/ProfileEditInput';
import { SectionHeader } from '../profile/edit/components/SectionHeader';
import { PE_COLORS, peStyles } from '../profile/edit/profileEditStyles';
import { psStyles } from './privacySecurityStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacySecurity'>;

type SocialProvider = 'google' | 'apple';

const SOCIAL_PROVIDERS: Array<{ key: SocialProvider; label: string; icon: string; field: keyof UserProfileDTO }> = [
  { key: 'google', label: 'Google', icon: 'google', field: 'googleProviderId' },
  { key: 'apple', label: 'Apple', icon: 'apple', field: 'appleProviderId' },
];

export const PrivacySecurityScreen: React.FC<Props> = ({ navigation }) => {
  const authUser = useAppSelector(state => state.auth.user);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unlinkingProvider, setUnlinkingProvider] = useState<SocialProvider | null>(null);
  const { supported: biometricsSupported, enabled: biometricsEnabled, loading: biometricsLoading, busy: biometricsBusy, toggle: toggleBiometrics } =
    useBiometrics();

  const loadProfile = useCallback(async () => {
    try {
      const data = await UserApi.getProfile();
      setProfile(data);
    } catch {
      // Keep last known state; Email/Mobile rows still show Redux-cached values.
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const linkedProviders = useMemo(
    () => SOCIAL_PROVIDERS.filter(item => Boolean(profile?.[item.field])),
    [profile],
  );

  const onUnlink = useCallback((provider: SocialProvider, label: string) => {
    Alert.alert(
      `Unlink ${label}?`,
      `You will no longer be able to sign in to Preelly using your ${label} account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            setUnlinkingProvider(provider);
            try {
              await UserApi.unlinkSocial(provider);
              setProfile(prev => (prev ? { ...prev, [`${provider}ProviderId`]: null } : prev));
            } catch (err) {
              Alert.alert('Unable to unlink', getApiErrorMessage(err, 'Failed to unlink account'));
            } finally {
              setUnlinkingProvider(null);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={peStyles.screen} edges={['top']}>
      <View style={peStyles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={peStyles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
        </Pressable>
        <Text style={peStyles.headerTitle}>Privacy and Security</Text>
        <View style={peStyles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={peStyles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Email" subtitle="" />
        <ProfileEditInput
          value={authUser?.email ?? ''}
          onChangeText={() => undefined}
          placeholder="Email"
          leftIcon="email-outline"
          rightIcon="pencil"
          editable={false}
          onPressRight={() => navigation.navigate('SetNewEmail')}
        />

        <SectionHeader title="Mobile Number" subtitle="" />
        <ProfileEditInput
          value={authUser?.phone ?? ''}
          onChangeText={() => undefined}
          placeholder="Mobile number"
          leftIcon="phone-outline"
          rightIcon="pencil"
          editable={false}
          onPressRight={() => navigation.navigate('SetNewMobile')}
        />

        <View style={psStyles.toggleRow}>
          <Text style={psStyles.toggleLabel}>Enable Biometrics</Text>
          <Switch
            value={biometricsEnabled}
            onValueChange={toggleBiometrics}
            disabled={biometricsLoading || biometricsBusy}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={biometricsEnabled ? PE_COLORS.primary : '#F9FAFB'}
            accessibilityLabel="Enable Biometrics"
          />
        </View>
        {!biometricsLoading && !biometricsSupported ? (
          <Text style={psStyles.hintText}>Biometric authentication isn&apos;t available on this device.</Text>
        ) : null}

        <SectionHeader
          title="Social Account"
          subtitle="Below are the platforms where your account is currently linked. You can unlink any account at any time using the button provided."
        />
        {loadingProfile ? (
          <ActivityIndicator color={PE_COLORS.primary} style={{ marginTop: 12 }} />
        ) : linkedProviders.length === 0 ? (
          <Text style={peStyles.sectionSubtitle}>No linked social accounts.</Text>
        ) : (
          linkedProviders.map(item => (
            <View key={item.key} style={psStyles.socialRow}>
              <View style={psStyles.socialLeft}>
                <Icon name={item.icon} size={22} color={PE_COLORS.text} />
                <Text style={psStyles.socialLabel}>{item.label}</Text>
              </View>
              {unlinkingProvider === item.key ? (
                <ActivityIndicator size="small" color={PE_COLORS.primary} />
              ) : (
                <Pressable
                  style={psStyles.socialUnlinkBtn}
                  onPress={() => onUnlink(item.key, item.label)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unlink ${item.label} account`}>
                  <Text style={psStyles.socialUnlinkText}>Unlink account</Text>
                  <Icon name="link-variant" size={16} color={PE_COLORS.primary} />
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
