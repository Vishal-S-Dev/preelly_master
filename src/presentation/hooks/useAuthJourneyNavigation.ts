import { useCallback } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AuthJourneyState } from '../../types/authJourney.types';

type AuthNav = NativeStackNavigationProp<RootStackParamList>;

export function useAuthJourneyNavigation() {
  const navigateAfterOtpVerify = useCallback(
    (navigation: AuthNav, authJourney: AuthJourneyState | null) => {
      if (!authJourney) {
        return;
      }

      if (authJourney.step === 'link_phone') {
        navigation.navigate('AuthLinkPhone');
        return;
      }

      if (authJourney.step === 'link_email') {
        navigation.navigate('AuthLinkEmail');
      }
    },
    [],
  );

  return { navigateAfterOtpVerify };
}
