import { AppDispatch } from '../../presentation/redux/store';
import {
  applyPresenceUpdate,
  PresenceUpdatePayload,
  resetPresence,
  setPresenceSync,
} from '../../presentation/redux/slices/presenceSlice';
import { getChatSocket } from './chatSocket';

let detachListeners: (() => void) | null = null;

export async function attachPresenceListeners(dispatch: AppDispatch): Promise<() => void> {
  if (detachListeners) {
    return detachListeners;
  }

  const socket = await getChatSocket();

  const onSync = (payload: { onlineUserIds?: string[]; lastSeenByUserId?: Record<string, string> }) => {
    dispatch(setPresenceSync(payload ?? {}));
  };

  const onUpdate = (payload: PresenceUpdatePayload) => {
    if (!payload?.userId) {
      return;
    }
    dispatch(applyPresenceUpdate(payload));
  };

  socket.on('presence:sync', onSync);
  socket.on('presence:update', onUpdate);

  detachListeners = () => {
    socket.off('presence:sync', onSync);
    socket.off('presence:update', onUpdate);
    detachListeners = null;
  };

  return detachListeners;
}

export function detachPresenceListeners(): void {
  detachListeners?.();
}

export function resetPresenceState(dispatch: AppDispatch): void {
  detachPresenceListeners();
  dispatch(resetPresence());
}
