import { useMemo } from 'react';
import { formatPresenceStatus } from '../screens/chat/chatRowUtils';
import {
  selectIsUserOnline,
  selectUserLastSeen,
} from '../redux/slices/presenceSlice';
import { useAppSelector } from './useRedux';

/** green = online/active, red = attention (unread while offline), none = no badge */
export type AvatarDotTone = 'green' | 'red' | 'none';

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
        dot: 'green' as const,
        statusText: options.hasUnread
          ? ''
          : formatPresenceStatus({ isOnline: true, updatedAt: options.updatedAt }),
      };
    }

    const online = Boolean(contactUserId && isOnline);
    const hasUnread = Boolean(options?.hasUnread);

    let dot: AvatarDotTone = 'none';
    if (online) {
      dot = 'green';
    } else if (hasUnread) {
      // Reference: unread rows show a red status pip on the contact avatar
      dot = 'red';
    }

    return {
      dot,
      statusText: formatPresenceStatus({
        isOnline: online,
        lastSeen,
        updatedAt: options?.updatedAt,
        hasUnread,
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
