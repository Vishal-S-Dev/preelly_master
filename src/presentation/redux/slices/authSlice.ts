import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import { AuthRepositoryImpl } from '../../../data/repository/AuthRepositoryImpl';
import { User } from '../../../domain/models/User';
import { LoginUseCase } from '../../../domain/usecases/LoginUseCase';
import { SendOtpUseCase, VerifyOtpUseCase } from '../../../domain/usecases/authUseCases';
import { storage } from '../../../utils/storage';
import { clearChatState } from './chatSlice';
import { ensureSocketReadyForUser } from '../../../data/network/chatSocket';
import { SendOtpRequestDTO } from '../../../data/dto/authDto';

const repo = new AuthRepositoryImpl();
const loginUseCase = new LoginUseCase(repo);
const sendOtpUseCase = new SendOtpUseCase(repo);
const verifyOtpUseCase = new VerifyOtpUseCase(repo);

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  emailForOtp: string;
  lastOtpRequest: SendOtpRequestDTO | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  emailForOtp: '',
  lastOtpRequest: null,
  loading: false,
  isGuest: false,
  isAuthenticated: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }) => {
    const session = await loginUseCase.execute(email, password);
    await repo.storeSession(session);
    if (session.user?.id) {
      await ensureSocketReadyForUser(session.user.id);
    }
    return session;
  },
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (request: SendOtpRequestDTO, { rejectWithValue }) => {
    try {
      await sendOtpUseCase.execute(request);
      return request;
    } catch (error: any) {
      const apiError = error?.response?.data;
      if (apiError?.message) {
        return rejectWithValue(apiError);
      }
      return rejectWithValue({ message: 'Failed to send OTP' });
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  await repo.logout();
  dispatch(clearChatState());
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }: { email: string; otp: string }) => {
    const session = await verifyOtpUseCase.execute(email, otp);
    await repo.storeSession(session);
    if (session.user?.id) {
      await ensureSocketReadyForUser(session.user.id);
    }
    return session;
  },
);

export const loadStoredSession = createAsyncThunk('auth/loadStoredSession', async () => {
  const accessToken = await repo.getStoredAccessToken();
  const refreshToken = await repo.getStoredRefreshToken();
  const userJson = await storage.getString(STORAGE_KEYS.USER_DATA);
  let user: User | null = null;
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson) as User & { _id?: string };
      user = {
        ...parsed,
        id: parsed.id ?? parsed._id ?? '',
      };
      if (!user.id) {
        user = null;
      }
    } catch {
      user = null;
    }
  }
  return { accessToken, refreshToken, user };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    continueAsGuest(state) {
      state.isAuthenticated = true;
      state.isGuest = true;
      state.user = null;
    },
    logoutSuccess(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isGuest = false;
    },
    updateAuthUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isGuest = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(sendOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.emailForOtp = action.payload.email.trim().toLowerCase();
        state.lastOtpRequest = action.payload;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          'Failed to send OTP';
      })
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isGuest = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'OTP verification failed';
      })
      .addCase(loadStoredSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.accessToken);
      })
      .addCase(logoutUser.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isGuest = false;
      });
  },
});

export const { continueAsGuest, logoutSuccess, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
