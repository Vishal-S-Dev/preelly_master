import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Controller } from 'react-hook-form';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { useAppSelector } from '../../../hooks/useRedux';
import { AddressCard } from './components/AddressCard';
import { AddressFormModal } from './components/AddressFormModal';
import { DatePickerInput } from './components/DatePickerInput';
import { GenderRadioGroup } from './components/GenderRadioGroup';
import { GetVerifiedCard } from './components/GetVerifiedCard';
import { NationalitySelector } from './components/NationalitySelector';
import { ProfileEditInput } from './components/ProfileEditInput';
import { SectionHeader } from './components/SectionHeader';
import { useProfileEdit } from './hooks/useProfileEdit';
import { peStyles } from './profileEditStyles';

export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProfileEdit'>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const allowLeaveRef = useRef(false);
  const authUser = useAppSelector(state => state.auth.user);
  const isGuest = useAppSelector(state => state.auth.isGuest);

  const requireCompletion =
    route.params?.requireCompletion === true ||
    (!isGuest && authUser?.isProfileComplete === false);

  const onProfileCompleted = useCallback(() => {
    allowLeaveRef.current = true;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    );
  }, [navigation]);

  const {
    form,
    submit,
    locations,
    identityVerification,
    loading,
    saving,
    locationSaving,
    addressModal,
    setAddressModal,
    onSetDefaultLocation,
    onDeleteLocation,
    onSaveLocation,
  } = useProfileEdit({ requireCompletion, onProfileCompleted });

  const { control, formState } = form;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (requireCompletion && !allowLeaveRef.current) {
        e.preventDefault();
        Alert.alert(
          'Complete your profile',
          'First name, last name, date of birth, and gender are required before you can continue.',
        );
        return;
      }
      if (!formState.isDirty || saving) {
        return;
      }
      e.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved profile edits.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [formState.isDirty, navigation, requireCompletion, saving]);

  const openHeaderMenu = useCallback(() => {
    const onRefresh = () => form.reset();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Reset form', 'Cancel'], cancelButtonIndex: 1 },
        index => {
          if (index === 0) {
            onRefresh();
          }
        },
      );
      return;
    }
    Alert.alert('Options', undefined, [
      { text: 'Reset form', onPress: onRefresh },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [form]);

  const onGetVerified = useCallback(() => {
    if (identityVerification.status !== 'none') {
      return;
    }
    navigation.navigate('GetVerified');
  }, [identityVerification.status, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[peStyles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={peStyles.screen} edges={['top']}>
      <View style={peStyles.header}>
        {requireCompletion ? (
          <View style={peStyles.headerBtn} />
        ) : (
          <Pressable
            onPress={() => navigation.goBack()}
            style={peStyles.headerBtn}
            accessibilityLabel="Go back">
            <Icon name="arrow-left" size={24} color="#111827" />
          </Pressable>
        )}
        <Text style={peStyles.headerTitle}>
          {requireCompletion ? 'Complete your profile' : 'My Profile'}
        </Text>
        {requireCompletion ? (
          <View style={peStyles.headerBtn} />
        ) : (
          <Pressable onPress={openHeaderMenu} style={peStyles.headerBtn} accessibilityLabel="More options">
            <Icon name="dots-vertical" size={24} color="#111827" />
          </Pressable>
        )}
      </View>

      {requireCompletion ? (
        <Text style={[peStyles.sectionSubtitle, { marginHorizontal: 20, marginBottom: 8 }]}>
          Please add your name, date of birth, and gender to continue using Preelly.
        </Text>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={peStyles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(320)}>
            {identityVerification.shouldShowCard ? (
              <GetVerifiedCard
                status={identityVerification.status}
                rejectionReason={identityVerification.rejectionReason}
                onPress={onGetVerified}
              />
            ) : null}

            <SectionHeader title="Profile Name" subtitle="This is displayed on your profile" />
            <Controller
              control={control}
              name="firstName"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <ProfileEditInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your first name"
                  leftIcon="account-outline"
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <ProfileEditInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your last name"
                  leftIcon="account-outline"
                  error={error?.message}
                />
              )}
            />

            <SectionHeader title="Account Details" subtitle="This is not visible to other users" />
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DatePickerInput value={value} onChange={onChange} error={error?.message} />
              )}
            />
            {!requireCompletion ? (
              <Controller
                control={control}
                name="nationality"
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <NationalitySelector value={value} onChange={onChange} error={error?.message} />
                )}
              />
            ) : null}

            <SectionHeader title="Gender" subtitle="Please fill in the details below" />
            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <GenderRadioGroup
                  value={value}
                  onChange={onChange}
                  hidePreferNotToSay={requireCompletion}
                  error={error?.message}
                />
              )}
            />

            {!requireCompletion ? (
              <>
                <SectionHeader title="Address" subtitle="Please review the details" />
                {locations.length === 0 ? (
                  <Text style={peStyles.sectionSubtitle}>No saved addresses yet.</Text>
                ) : (
                  locations.map(location => (
                    <AddressCard
                      key={location.id}
                      location={location}
                      onToggleDefault={onSetDefaultLocation}
                      onEdit={loc => setAddressModal({ mode: 'edit', location: loc })}
                      onDelete={onDeleteLocation}
                    />
                  ))
                )}
                <Pressable
                  style={peStyles.addLocationBtn}
                  onPress={() => setAddressModal({ mode: 'add' })}
                  accessibilityRole="button"
                  accessibilityLabel="Add new location">
                  <Text style={peStyles.addLocationText}>Add new location</Text>
                </Pressable>
              </>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[peStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[peStyles.submitBtn, saving || !formState.isValid ? peStyles.submitBtnDisabled : null]}
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={requireCompletion ? 'Continue' : 'Submit profile'}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={peStyles.submitText}>{requireCompletion ? 'Continue' : 'Submit'}</Text>
          )}
        </Pressable>
      </View>

      {!requireCompletion ? (
        <AddressFormModal
          visible={Boolean(addressModal)}
          initial={addressModal?.mode === 'edit' ? addressModal.location : null}
          saving={locationSaving}
          onClose={() => setAddressModal(null)}
          onSave={onSaveLocation}
        />
      ) : null}
    </SafeAreaView>
  );
};
