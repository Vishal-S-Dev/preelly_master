import { useIsFocused } from '@react-navigation/native';
import { useAppForeground } from './useAppForeground';

/**
 * Combined gate for reel auto-play: screen must be focused and app in foreground.
 */
export const useReelPlaybackGate = (): boolean => {
  const isFocused = useIsFocused();
  const isAppForeground = useAppForeground();
  return isFocused && isAppForeground;
};
