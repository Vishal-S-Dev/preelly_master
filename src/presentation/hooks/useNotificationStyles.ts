import { useMemo } from 'react';
import { useAppTheme } from './useAppTheme';
import {
  getNotificationStyles,
  getNotificationTheme,
  NotificationStyles,
  NotificationTheme,
} from '../components/notifications/notificationStyles';

export const useNotificationStyles = (): {
  styles: NotificationStyles;
  colors: NotificationTheme;
} => {
  const theme = useAppTheme();
  return useMemo(
    () => ({
      styles: getNotificationStyles(theme),
      colors: getNotificationTheme(theme),
    }),
    [theme],
  );
};
