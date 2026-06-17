import { useMemo } from 'react';
import { getProfileStyles, getProfileTheme, ProfileStyles, ProfileTheme } from '../components/profile/profileStyles';
import { useAppTheme } from './useAppTheme';

export const useProfileStyles = (): {
  styles: ProfileStyles;
  colors: ProfileTheme;
} => {
  const theme = useAppTheme();
  return useMemo(
    () => ({
      styles: getProfileStyles(theme),
      colors: getProfileTheme(theme),
    }),
    [theme],
  );
};
