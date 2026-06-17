import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatRepositoryImpl } from '../../../data/repository/ChatRepositoryImpl';
import { ChatMessage, ChatThread } from '../../../domain/models/ChatThread';
import { User } from '../../../domain/models/User';
import {
  CreateOrGetChatUseCase,
  GetChatByIdUseCase,
  GetUnreadChatCountUseCase,
  LoadChatsUseCase,
  MarkChatReadUseCase,
  SendChatMessageUseCase,
} from '../../../domain/usecases/chatUseCases';

const chatRepo = new ChatRepositoryImpl();
const loadChatsUseCase = new LoadChatsUseCase(chatRepo);
const unreadUseCase = new GetUnreadChatCountUseCase(chatRepo);
const markReadUseCase = new MarkChatReadUseCase(chatRepo);
const getChatByIdUseCase = new GetChatByIdUseCase(chatRepo);
const createOrGetChatUseCase = new CreateOrGetChatUseCase(chatRepo);
const sendChatMessageUseCase = new SendChatMessageUseCase(chatRepo);

type AuthPick = {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
  };
};

interface ChatState {
  threads: ChatThread[];
  totalUnread: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  activeThread: ChatThread | null;
  activeMessages: ChatMessage[];
  threadLoading: boolean;
  threadError: string | null;
  sendingMessage: boolean;
}

const initialState: ChatState = {
  threads: [],
  totalUnread: 0,
  loading: false,
  refreshing: false,
  error: null,
  activeThread: null,
  activeMessages: [],
  threadLoading: false,
  threadError: null,
  sendingMessage: false,
};

export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async ({ refresh = false }: { refresh?: boolean } = {}, { getState, rejectWithValue }) => {
    const { auth } = getState() as AuthPick;
    if (!auth.isAuthenticated || auth.isGuest || !auth.user?.id) {
      return { threads: [] as ChatThread[], totalUnread: 0, refresh };
    }
    try {
      const threads = await loadChatsUseCase.execute(auth.user.id);
      let totalUnread = 0;
      try {
        totalUnread = await unreadUseCase.execute();
      } catch {
        totalUnread = threads.reduce((sum, t) => sum + t.unreadForViewer, 0);
      }
      return { threads, totalUnread, refresh };
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load chats');
    }
  },
);

export const createOrGetProductChat = createAsyncThunk(
  'chat/createOrGetProductChat',
  async (
    { productId, sellerId }: { productId: string; sellerId: string },
    { getState, rejectWithValue },
  ) => {
    const { auth } = getState() as AuthPick;
    if (!auth.isAuthenticated || auth.isGuest || !auth.user) {
      return rejectWithValue('Please sign in to chat with the seller.');
    }
    if (auth.user.id === sellerId) {
      return rejectWithValue('You cannot start a chat on your own listing.');
    }
    try {
      return await createOrGetChatUseCase.execute(productId, sellerId, auth.user);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to open chat');
    }
  },
);

export const fetchChatThread = createAsyncThunk(
  'chat/fetchChatThread',
  async (threadId: string, { getState, rejectWithValue }) => {
    const { auth } = getState() as AuthPick;
    if (!auth.user?.id) {
      return rejectWithValue('Not signed in');
    }
    try {
      const { thread, messages } = await getChatByIdUseCase.execute(threadId, auth.user.id);
      await markReadUseCase.execute(threadId);
      return { thread, messages };
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load chat');
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async (
    { threadId, text }: { threadId: string; text: string },
    { getState, rejectWithValue },
  ) => {
    const { auth, chat } = getState() as AuthPick & { chat: ChatState };
    if (!auth.user) {
      return rejectWithValue('Not signed in');
    }
    const thread = chat.activeThread;
    const senderRole =
      thread?.viewerRole === 'buyer' || thread?.viewerRole === 'seller'
        ? thread.viewerRole
        : null;
    try {
      const message = await sendChatMessageUseCase.execute(
        threadId,
        text,
        auth.user,
        senderRole,
      );
      return message;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to send');
    }
  },
);

export const markThreadRead = createAsyncThunk('chat/markThreadRead', async (threadId: string) => {
  await markReadUseCase.execute(threadId);
  return threadId;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearChatState(state) {
      state.threads = [];
      state.totalUnread = 0;
      state.error = null;
      state.activeThread = null;
      state.activeMessages = [];
      state.threadError = null;
    },
    clearActiveThread(state) {
      state.activeThread = null;
      state.activeMessages = [];
      state.threadError = null;
    },
    addOptimisticMessage(state, action: PayloadAction<ChatMessage>) {
      state.activeMessages.push(action.payload);
    },
    removeOptimisticMessage(state, action: PayloadAction<string>) {
      state.activeMessages = state.activeMessages.filter(m => m.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChats.pending, (state, action) => {
        state.loading = !(action.meta.arg?.refresh ?? false);
        state.refreshing = Boolean(action.meta.arg?.refresh);
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.threads = action.payload.threads;
        state.totalUnread = action.payload.totalUnread;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to load chats';
      })
      .addCase(createOrGetProductChat.pending, state => {
        state.threadLoading = true;
        state.threadError = null;
      })
      .addCase(createOrGetProductChat.fulfilled, (state, action) => {
        state.threadLoading = false;
        const { thread, messages } = action.payload;
        state.activeThread = thread;
        state.activeMessages = messages;
        const exists = state.threads.some(t => t.id === thread.id);
        state.threads = exists
          ? state.threads.map(t => (t.id === thread.id ? thread : t))
          : [thread, ...state.threads];
      })
      .addCase(createOrGetProductChat.rejected, (state, action) => {
        state.threadLoading = false;
        state.threadError =
          typeof action.payload === 'string' ? action.payload : 'Failed to open chat';
      })
      .addCase(fetchChatThread.pending, state => {
        state.threadLoading = true;
        state.threadError = null;
      })
      .addCase(fetchChatThread.fulfilled, (state, action) => {
        state.threadLoading = false;
        state.activeThread = action.payload.thread;
        state.activeMessages = action.payload.messages;
        const id = action.payload.thread.id;
        let cleared = 0;
        state.threads = state.threads.map(t => {
          if (t.id !== id) {
            return t;
          }
          cleared = t.unreadForViewer;
          return { ...t, unreadForViewer: 0 };
        });
        state.totalUnread = Math.max(0, state.totalUnread - cleared);
      })
      .addCase(fetchChatThread.rejected, (state, action) => {
        state.threadLoading = false;
        state.threadError =
          typeof action.payload === 'string' ? action.payload : 'Failed to load chat';
      })
      .addCase(sendChatMessage.pending, state => {
        state.sendingMessage = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const msg = action.payload;
        const exists = state.activeMessages.some(m => m.id === msg.id);
        if (!exists) {
          state.activeMessages = [
            ...state.activeMessages.filter(m => !m.id.startsWith('temp-')),
            msg,
          ];
        }
        if (state.activeThread) {
          state.activeThread = {
            ...state.activeThread,
            lastMessage: msg.text,
            updatedAt: msg.createdAt,
          };
        }
      })
      .addCase(sendChatMessage.rejected, state => {
        state.sendingMessage = false;
      })
      .addCase(markThreadRead.fulfilled, (state, action) => {
        const id = action.payload;
        let cleared = 0;
        state.threads = state.threads.map(t => {
          if (t.id !== id) {
            return t;
          }
          cleared = t.unreadForViewer;
          return { ...t, unreadForViewer: 0 };
        });
        state.totalUnread = Math.max(0, state.totalUnread - cleared);
      });
  },
});

export const { clearChatState, clearActiveThread, addOptimisticMessage, removeOptimisticMessage } =
  chatSlice.actions;
export default chatSlice.reducer;
