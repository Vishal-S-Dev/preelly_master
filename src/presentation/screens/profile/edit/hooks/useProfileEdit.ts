import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { UserApi, LocationDTO } from '../../../../../data/api/UserApi';
import { STORAGE_KEYS } from '../../../../../constants/appConstants';
import {
  LocationPayload,
  UserLocation,
  ProfileEditFormValues,
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

const PROFILE_EDIT_KEY = ['profileEdit'];
const LOCATIONS_KEY = ['profileLocations'];

const mapLocationDto = (dto: LocationDTO, index: number): UserLocation => {
  const id = dto._id ?? dto.id ?? `loc_${index}`;
  const parts = [dto.building, dto.apartment, dto.city].filter(Boolean);
  return {
    id,
    label: dto.label ?? 'Home',
    city: dto.city,
    building: dto.building,
    apartment: dto.apartment,
    fullAddress: parts.length ? parts.join(', ') : 'Address not set',
    isDefault: Boolean(dto.isDefault),
  };
};

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

  const profileQuery = useQuery({
    queryKey: PROFILE_EDIT_KEY,
    queryFn: () => UserApi.getProfile(),
  });

  const locationsQuery = useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: () => UserApi.getLocations(),
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
          isDefault: true,
        });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
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

  const isVerified = Boolean(
    profileQuery.data?.isVerified ?? profileQuery.data?.verified ?? authUser?.isVerified,
  );

  return {
    form,
    submit,
    locations,
    isVerified,
    requireCompletion,
    loading: profileQuery.isLoading || locationsQuery.isLoading,
    saving: updateProfileMutation.isPending,
    locationSaving: locationMutation.isPending,
    addressModal,
    setAddressModal,
    onSetDefaultLocation,
    onDeleteLocation,
    onSaveLocation,
    refetch: () => {
      profileQuery.refetch();
      locationsQuery.refetch();
    },
  };
};
