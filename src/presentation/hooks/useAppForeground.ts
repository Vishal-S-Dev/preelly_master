import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const isActiveState = (state: AppStateStatus) => state === 'active';

/**
 * Tracks whether the app is in the foreground (active).
 * Pauses reel playback when backgrounded, minimized, or screen locked.
 */
export const useAppForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(() =>
    isActiveState(AppState.currentState),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsForeground(isActiveState(nextState));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
};
