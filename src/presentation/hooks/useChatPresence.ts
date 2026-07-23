import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { attachPresenceListeners } from '../../data/network/presenceSocket';
import { useAppDispatch, useAppSelector } from './useRedux';

/** Re-attaches presence listeners when the inbox gains focus (bootstrap handles initial attach). */
export const useChatPresence = (enabled = true) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated && !s.auth.isGuest);
  const userId = useAppSelector(s => s.auth.user?.id ?? null);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !isAuthenticated || !userId) {
        return undefined;
      }
      attachPresenceListeners(dispatch).catch(() => undefined);
      return undefined;
    }, [dispatch, enabled, isAuthenticated, userId]),
  );
};
