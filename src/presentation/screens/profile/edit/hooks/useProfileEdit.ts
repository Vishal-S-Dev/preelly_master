import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { UserApi } from '../../../../../data/api/UserApi';
import { STORAGE_KEYS } from '../../../../../constants/appConstants';
import {
  BankAccount,
  BankAccountPayload,
  LocationPayload,
  ProfileEditFormValues,
  SavedCard,
  SavedCardPayload,
  UserLocation,
} from '../../../../../types/profileEdit.types';
import { UserProfileDTO } from '../../../../../types/userProfile.types';
import { storage } from '../../../../../utils/storage';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useRedux';
import { updateAuthUser } from '../../../../redux/slices/authSlice';
import {
  mapProfileToForm,
  splitName,
} from '../profileEditUtils';
import { buildMergedProfilePayload } from '../profilePayloadBuilder';
import { profileEditSchema } from '../validation/profileEditSchema';
import { profileCompletionSchema } from '../validation/profileCompletionSchema';
import { mapLocationDto } from '../utils/locationDtoUtils';
import { mapBankAccountDto, mapSavedCardDto } from '../utils/bankCardDtoUtils';
import {
  isIdentityVerificationActionable,
  resolveIdentityVerificationStatus,
  shouldShowIdentityVerificationCard,
} from '../utils/identityVerificationUtils';

const PROFILE_EDIT_KEY = ['profileEdit'];
const LOCATIONS_KEY = ['profileLocations'];
const BANK_ACCOUNTS_KEY = ['profileBankAccounts'];
const SAVED_CARDS_KEY = ['profileSavedCards'];

export interface UseProfileEditOptions {
  requireCompletion?: boolean;
  onProfileCompleted?: () => void;
}

export const useProfileEdit = (options?: UseProfileEditOptions) => {
  const requireCompletion = Boolean(options?.requireCompletion);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(state => state.auth.user);
  const [addressModal, setAddressModal] = useState<null | { mode: 'add' } | { mode: 'edit'; location: UserLocation }>(
    null,
  );
  const [bankModal, setBankModal] = useState<null | { mode: 'add' } | { mode: 'edit'; account: BankAccount }>(
    null,
  );
  const [cardModal, setCardModal] = useState<null | { mode: 'add' } | { mode: 'edit'; card: SavedCard }>(
    null,
  );

  const profileQuery = useQuery({
    queryKey: PROFILE_EDIT_KEY,
    queryFn: () => UserApi.getProfile(),
  });

  const locationsQuery = useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: () => UserApi.getLocations(),
  });

  const bankAccountsQuery = useQuery({
    queryKey: BANK_ACCOUNTS_KEY,
    queryFn: () => UserApi.getBankAccounts(),
  });

  const savedCardsQuery = useQuery({
    queryKey: SAVED_CARDS_KEY,
    queryFn: () => UserApi.getSavedCards(),
  });

  const defaultValues = useMemo<ProfileEditFormValues>(() => {
    const profile = profileQuery.data;
    if (!profile) {
      const split = splitName(authUser?.name);
      return {
        firstName: split.firstName,
        lastName: split.lastName,
        dateOfBirth: '',
        nationality: '',
        gender: 'prefer_not_to_say',
      };
    }
    return mapProfileToForm(profile, authUser?.name);
  }, [authUser?.name, profileQuery.data]);

  const validationSchema = requireCompletion ? profileCompletionSchema : profileEditSchema;

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (profileQuery.data || authUser) {
      form.reset(defaultValues);
    }
  }, [authUser, defaultValues, form, profileQuery.data]);

  const locations = useMemo(
    () => (locationsQuery.data ?? []).map(mapLocationDto),
    [locationsQuery.data],
  );

  const bankAccounts = useMemo(
    () => (bankAccountsQuery.data ?? []).map(mapBankAccountDto),
    [bankAccountsQuery.data],
  );

  const savedCards = useMemo(
    () => (savedCardsQuery.data ?? []).map(mapSavedCardDto),
    [savedCardsQuery.data],
  );

  const persistAuthUser = useCallback(
    async (updated: UserProfileDTO) => {
      const name = updated.name ?? authUser?.name ?? '';
      const isProfileComplete = updated.isProfileComplete ?? true;
      dispatch(
        updateAuthUser({
          name,
          avatar: updated.avatar ?? undefined,
          isProfileComplete,
          isVerified: updated.isVerified ?? authUser?.isVerified,
        }),
      );
      const userJson = await storage.getString(STORAGE_KEYS.USER_DATA);
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson) as Record<string, unknown>;
          parsed.name = name;
          parsed.isProfileComplete = isProfileComplete;
          if (updated.avatar) {
            parsed.avatar = updated.avatar;
          }
          await storage.setString(STORAGE_KEYS.USER_DATA, JSON.stringify(parsed));
        } catch {
          // ignore corrupt cache
        }
      }
    },
    [authUser?.isVerified, authUser?.name, dispatch],
  );

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileEditFormValues) => {
      const existing = profileQuery.data;
      if (!existing) {
        throw new Error('Profile not loaded');
      }
      const payload = buildMergedProfilePayload(existing, values);
      return UserApi.updateProfile(payload);
    },
    onSuccess: async updated => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_EDIT_KEY });
      const isProfileComplete =
        requireCompletion || updated.isProfileComplete !== false;
      await persistAuthUser({ ...updated, isProfileComplete });
    },
  });

  const locationMutation = useMutation({
    mutationFn: async (input: {
      mode: 'add' | 'edit' | 'delete' | 'default';
      id?: string;
      payload?: LocationPayload;
    }) => {
      if (input.mode === 'add' && input.payload) {
        return UserApi.addLocation(input.payload);
      }
      if (input.mode === 'edit' && input.id && input.payload) {
        return UserApi.updateLocation(input.id, input.payload);
      }
      if (input.mode === 'delete' && input.id) {
        await UserApi.deleteLocation(input.id);
        return null;
      }
      if (input.mode === 'default' && input.id) {
        const target = locations.find(l => l.id === input.id);
        if (!target) {
          return null;
        }
        return UserApi.updateLocation(input.id, {
          label: target.label,
          city: target.city,
          building: target.building,
          apartment: target.apartment,
          detailLocation: target.detailLocation,
          coordinates:
            target.latitude != null && target.longitude != null
              ? [target.latitude, target.longitude]
              : undefined,
          isDefault: true,
        });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
    },
  });

  const bankMutation = useMutation({
    mutationFn: async (input: {
      mode: 'add' | 'edit' | 'delete' | 'default';
      id?: string;
      payload?: BankAccountPayload;
    }) => {
      if (input.mode === 'add' && input.payload) {
        return UserApi.addBankAccount(input.payload);
      }
      if (input.mode === 'edit' && input.id && input.payload) {
        return UserApi.updateBankAccount(input.id, input.payload);
      }
      if (input.mode === 'delete' && input.id) {
        await UserApi.deleteBankAccount(input.id);
        return null;
      }
      if (input.mode === 'default' && input.id) {
        return UserApi.updateBankAccount(input.id, { isPrimary: true } as BankAccountPayload);
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });

  const cardMutation = useMutation({
    mutationFn: async (input: {
      mode: 'add' | 'edit' | 'delete' | 'default';
      id?: string;
      payload?: SavedCardPayload;
    }) => {
      if (input.mode === 'add' && input.payload) {
        return UserApi.addSavedCard(input.payload);
      }
      if (input.mode === 'edit' && input.id && input.payload) {
        return UserApi.updateSavedCard(input.id, input.payload);
      }
      if (input.mode === 'delete' && input.id) {
        await UserApi.deleteSavedCard(input.id);
        return null;
      }
      if (input.mode === 'default' && input.id) {
        return UserApi.updateSavedCard(input.id, { isPrimary: true });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_CARDS_KEY });
    },
  });

  const submit = form.handleSubmit(async values => {
    try {
      const updated = await updateProfileMutation.mutateAsync(values);
      if (requireCompletion) {
        options?.onProfileCompleted?.();
        return;
      }
      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch {
      Alert.alert('Update failed', 'Could not save profile. Please try again.');
    }
  });

  const onSetDefaultLocation = useCallback(
    (id: string) => {
      locationMutation.mutate({ mode: 'default', id });
    },
    [locationMutation],
  );

  const onDeleteLocation = useCallback(
    (id: string) => {
      Alert.alert('Delete address', 'Remove this location from your profile?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => locationMutation.mutate({ mode: 'delete', id }),
        },
      ]);
    },
    [locationMutation],
  );

  const onSaveLocation = useCallback(
    async (payload: LocationPayload, editId?: string) => {
      try {
        if (editId) {
          await locationMutation.mutateAsync({ mode: 'edit', id: editId, payload });
        } else {
          await locationMutation.mutateAsync({ mode: 'add', payload });
        }
        setAddressModal(null);
      } catch {
        Alert.alert('Location error', 'Could not save this address. Please try again.');
      }
    },
    [locationMutation],
  );

  const onSetPrimaryBank = useCallback(
    (id: string) => {
      bankMutation.mutate({ mode: 'default', id });
    },
    [bankMutation],
  );

  const onDeleteBank = useCallback(
    (id: string) => {
      Alert.alert('Delete bank account', 'Remove this bank account from your profile?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => bankMutation.mutate({ mode: 'delete', id }),
        },
      ]);
    },
    [bankMutation],
  );

  const onSaveBank = useCallback(
    async (payload: BankAccountPayload, editId?: string) => {
      try {
        if (editId) {
          await bankMutation.mutateAsync({ mode: 'edit', id: editId, payload });
        } else {
          await bankMutation.mutateAsync({ mode: 'add', payload });
        }
        setBankModal(null);
      } catch {
        Alert.alert('Bank account error', 'Could not save this bank account. Please try again.');
      }
    },
    [bankMutation],
  );

  const onSetPrimaryCard = useCallback(
    (id: string) => {
      cardMutation.mutate({ mode: 'default', id });
    },
    [cardMutation],
  );

  const onDeleteCard = useCallback(
    (id: string) => {
      Alert.alert('Delete card', 'Remove this card from your profile?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => cardMutation.mutate({ mode: 'delete', id }),
        },
      ]);
    },
    [cardMutation],
  );

  const onSaveCard = useCallback(
    async (payload: SavedCardPayload, editId?: string) => {
      try {
        if (editId) {
          await cardMutation.mutateAsync({ mode: 'edit', id: editId, payload });
        } else {
          await cardMutation.mutateAsync({ mode: 'add', payload });
        }
        setCardModal(null);
      } catch {
        Alert.alert('Card error', 'Could not save this card. Please try again.');
      }
    },
    [cardMutation],
  );

  const identityVerification = useMemo(() => {
    const profile = profileQuery.data;
    const status = resolveIdentityVerificationStatus({
      status: profile?.identityVerificationStatus,
      identityVerifiedAt: profile?.identityVerifiedAt,
    });

    return {
      status,
      rejectionReason: profile?.identityVerificationRejectionReason ?? null,
      submittedAt: profile?.identityVerificationSubmittedAt ?? null,
      shouldShowCard: shouldShowIdentityVerificationCard(status),
      isActionable: isIdentityVerificationActionable(status),
    };
  }, [profileQuery.data]);

  const isVerified = Boolean(
    profileQuery.data?.isVerified ?? profileQuery.data?.verified ?? authUser?.isVerified,
  );

  return {
    form,
    submit,
    locations,
    bankAccounts,
    savedCards,
    isVerified,
    identityVerification,
    requireCompletion,
    loading: profileQuery.isLoading || locationsQuery.isLoading,
    saving: updateProfileMutation.isPending,
    locationSaving: locationMutation.isPending,
    bankSaving: bankMutation.isPending,
    cardSaving: cardMutation.isPending,
    addressModal,
    setAddressModal,
    onSetDefaultLocation,
    onDeleteLocation,
    onSaveLocation,
    bankModal,
    setBankModal,
    onSetPrimaryBank,
    onDeleteBank,
    onSaveBank,
    cardModal,
    setCardModal,
    onSetPrimaryCard,
    onDeleteCard,
    onSaveCard,
    refetch: () => {
      profileQuery.refetch();
      locationsQuery.refetch();
      bankAccountsQuery.refetch();
      savedCardsQuery.refetch();
    },
  };
};
