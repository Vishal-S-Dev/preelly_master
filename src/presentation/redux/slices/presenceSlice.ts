import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PresenceUpdatePayload {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

interface PresenceState {
  onlineUserIds: Record<string, true>;
  lastSeenByUserId: Record<string, string>;
}

const initialState: PresenceState = {
  onlineUserIds: {},
  lastSeenByUserId: {},
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    resetPresence: () => initialState,
    setPresenceSync: (
      state,
      action: PayloadAction<{ onlineUserIds?: string[]; lastSeenByUserId?: Record<string, string> }>,
    ) => {
      state.onlineUserIds = {};
      (action.payload.onlineUserIds ?? []).forEach(id => {
        if (id) {
          state.onlineUserIds[String(id)] = true;
        }
      });
      if (action.payload.lastSeenByUserId) {
        state.lastSeenByUserId = {
          ...state.lastSeenByUserId,
          ...action.payload.lastSeenByUserId,
        };
      }
    },
    applyPresenceUpdate: (state, action: PayloadAction<PresenceUpdatePayload>) => {
      const userId = String(action.payload.userId);
      if (action.payload.online) {
        state.onlineUserIds[userId] = true;
        delete state.lastSeenByUserId[userId];
      } else {
        delete state.onlineUserIds[userId];
        if (action.payload.lastSeen) {
          state.lastSeenByUserId[userId] = action.payload.lastSeen;
        }
      }
    },
  },
});

export const { resetPresence, setPresenceSync, applyPresenceUpdate } = presenceSlice.actions;
export default presenceSlice.reducer;

export const selectIsUserOnline = (
  state: { presence: PresenceState },
  userId?: string | null,
): boolean => {
  if (!userId) {
    return false;
  }
  return Boolean(state.presence.onlineUserIds[String(userId)]);
};

export const selectUserLastSeen = (
  state: { presence: PresenceState },
  userId?: string | null,
): string | undefined => {
  if (!userId) {
    return undefined;
  }
  return state.presence.lastSeenByUserId[String(userId)];
};
