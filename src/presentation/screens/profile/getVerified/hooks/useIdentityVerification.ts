import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { UserApi } from '../../../../../data/api/UserApi';
import { STORAGE_KEYS } from '../../../../../constants/appConstants';
import { storage } from '../../../../../utils/storage';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useRedux';
import { updateAuthUser } from '../../../../redux/slices/authSlice';

const PROFILE_EDIT_KEY = ['profileEdit'];

const mapAssetToUploadFile = (asset: Asset, fallbackName: string) => ({
  uri: asset.uri as string,
  type: asset.type ?? 'image/jpeg',
  fileName: asset.fileName ?? fallbackName,
});

export const useIdentityVerification = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const authUser = useAppSelector(state => state.auth.user);

  const persistVerifiedState = useCallback(
    async (isVerified: boolean) => {
      dispatch(updateAuthUser({ isVerified }));
      const userJson = await storage.getString(STORAGE_KEYS.USER_DATA);
      if (!userJson) {
        return;
      }
      try {
        const parsed = JSON.parse(userJson) as Record<string, unknown>;
        parsed.isVerified = isVerified;
        await storage.setString(STORAGE_KEYS.USER_DATA, JSON.stringify(parsed));
      } catch {
        // ignore corrupt cache
      }
    },
    [dispatch],
  );

  const mutation = useMutation({
    mutationFn: async (input: { front: Asset; back: Asset }) => {
      return UserApi.submitIdentityVerification(
        mapAssetToUploadFile(input.front, 'emirates_id_front.jpg'),
        mapAssetToUploadFile(input.back, 'emirates_id_back.jpg'),
      );
    },
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_EDIT_KEY });

      const isVerified = Boolean(
        response.isVerified ?? response.verified ?? authUser?.isVerified,
      );
      if (isVerified) {
        await persistVerifiedState(true);
      }
    },
  });

  const submit = useCallback(
    async (front: Asset | null, back: Asset | null) => {
      if (!front?.uri || !back?.uri) {
        Alert.alert('Missing documents', 'Please upload both the front and back of your Emirates ID.');
        return false;
      }

      try {
        const response = await mutation.mutateAsync({ front, back });
        const isVerified = Boolean(response.isVerified ?? response.verified);
        Alert.alert(
          isVerified ? 'Verification complete' : 'Verification submitted',
          response.message ??
            (isVerified
              ? 'Your account has been verified successfully.'
              : 'Your documents have been submitted. We will review them shortly.'),
        );
        return true;
      } catch {
        Alert.alert(
          'Submission failed',
          'Could not submit your Emirates ID. Please check your connection and try again.',
        );
        return false;
      }
    },
    [mutation],
  );

  return {
    submit,
    submitting: mutation.isPending,
  };
};
