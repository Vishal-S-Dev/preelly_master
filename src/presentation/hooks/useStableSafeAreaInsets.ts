import { useMemo } from 'react';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

/** Snapshot at app launch — reliable before modal/stack attaches to window hierarchy. */
const launchInsets = initialWindowMetrics?.insets ?? {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

/**
 * Safe area insets that never regress to 0 on first paint (common with fullScreenModal +
 * nested stacks). Uses the greater of live insets and launch-time metrics.
 */
export const useStableSafeAreaInsets = () => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      top: Math.max(insets.top, launchInsets.top),
      bottom: Math.max(insets.bottom, launchInsets.bottom),
      left: Math.max(insets.left, launchInsets.left),
      right: Math.max(insets.right, launchInsets.right),
    }),
    [insets.top, insets.bottom, insets.left, insets.right],
  );
};
