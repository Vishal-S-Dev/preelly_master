import { useMemo } from 'react';
import { formatPresenceStatus } from '../screens/chat/chatRowUtils';
import {
  selectIsUserOnline,
  selectUserLastSeen,
} from '../redux/slices/presenceSlice';
import { useAppSelector } from './useRedux';

export type AvatarDotTone = 'green' | 'none';

export function useContactPresence(
  contactUserId?: string | null,
  options?: {
    alwaysOnline?: boolean;
    updatedAt?: string;
    hasUnread?: boolean;
  },
): { dot: AvatarDotTone; statusText: string } {
  const isOnline = useAppSelector(s => selectIsUserOnline(s, contactUserId));
  const lastSeen = useAppSelector(s => selectUserLastSeen(s, contactUserId));

  return useMemo(() => {
    if (options?.alwaysOnline) {
      return {
        dot: 'green',
        statusText: options.hasUnread
          ? ''
          : formatPresenceStatus({ isOnline: true, updatedAt: options.updatedAt }),
      };
    }

    const online = Boolean(contactUserId && isOnline);
    return {
      dot: online ? 'green' : 'none',
      statusText: formatPresenceStatus({
        isOnline: online,
        lastSeen,
        updatedAt: options?.updatedAt,
        hasUnread: options?.hasUnread,
      }),
    };
  }, [
    contactUserId,
    isOnline,
    lastSeen,
    options?.alwaysOnline,
    options?.updatedAt,
    options?.hasUnread,
  ]);
}
