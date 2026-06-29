import { useMemo } from 'react';
import {
  getSettingsStyles,
  getSettingsTheme,
  SettingsStyles,
  SettingsTheme,
} from '../components/settings/settingsStyles';
import { useAppTheme } from './useAppTheme';

export const useSettingsStyles = (): {
  styles: SettingsStyles;
  colors: SettingsTheme;
} => {
  const theme = useAppTheme();
  return useMemo(
    () => ({
      styles: getSettingsStyles(theme),
      colors: getSettingsTheme(theme),
    }),
    [theme],
  );
};
