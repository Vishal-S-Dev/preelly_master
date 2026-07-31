import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import { AuthRepositoryImpl } from '../../../data/repository/AuthRepositoryImpl';
import { User } from '../../../domain/models/User';
import { LoginUseCase } from '../../../domain/usecases/LoginUseCase';
import {
  SendOtpUseCase,
  VerifyOtpUseCase,
} from '../../../domain/usecases/authUseCases';
import { storage } from '../../../utils/storage';
import { clearChatState } from './chatSlice';
import { resetPresenceState } from '../../../data/network/presenceSocket';
import { ensureSocketReadyForUser } from '../../../data/network/chatSocket';
import { attachPresenceListeners } from '../../../data/network/presenceSocket';
import { SendOtpRequestDTO, VerifyOtpRequestDto } from '../../../data/dto/authDto';
import { AuthJourneyState } from '../../../types/authJourney.types';
import { mergeAuthJourney, resolveNextAuthJourneyStep } from '../../../utils/authJourneyUtils';

const repo = new AuthRepositoryImpl();
const loginUseCase = new LoginUseCase(repo);
const sendOtpUseCase = new SendOtpUseCase(repo);
const verifyOtpUseCase = new VerifyOtpUseCase(repo);

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  otpSession: SendOtpRequestDTO | null;
  authJourney: AuthJourneyState | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  otpSession: null,
  authJourney: null,
  loading: false,
  isGuest: false,
  isAuthenticated: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }, { dispatch }) => {
    const session = await loginUseCase.execute(email, password);
    await repo.storeSession(session);
    if (session.user?.id) {
      await ensureSocketReadyForUser(session.user.id);
      attachPresenceListeners(dispatch).catch(() => undefined);
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
  resetPresenceState(dispatch);
  dispatch(clearChatState());
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (request: VerifyOtpRequestDto, { dispatch, rejectWithValue }) => {
    try {
      const result = await verifyOtpUseCase.execute(request);
      if (result.kind === 'authenticated') {
        await repo.storeSession(result.session);
        if (result.session.user?.id) {
          await ensureSocketReadyForUser(result.session.user.id);
          attachPresenceListeners(dispatch).catch(() => undefined);
        }
      }
      return result;
    } catch (error: any) {
      const apiError = error?.response?.data;
      if (apiError?.message) {
        return rejectWithValue(apiError);
      }
      return rejectWithValue({ message: error?.message ?? 'OTP verification failed' });
    }
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
      state.authJourney = null;
    },
    logoutSuccess(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isGuest = false;
      state.otpSession = null;
      state.authJourney = null;
    },
    updateAuthUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuthJourney(state, action: PayloadAction<AuthJourneyState | null>) {
      state.authJourney = action.payload;
    },
    clearAuthJourney(state) {
      state.authJourney = null;
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
        state.otpSession = null;
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
        state.otpSession = action.payload;
        const channel = action.payload.channel ?? 'email';
        state.authJourney = mergeAuthJourney(state.authJourney, {
          primaryChannel: channel,
          step:
            state.authJourney?.step === 'link_phone' || state.authJourney?.step === 'link_email'
              ? 'secondary_otp'
              : 'primary_otp',
          email: action.payload.email,
          phone: action.payload.phone,
          phoneCountryCode: action.payload.phoneCountryCode,
          phoneCountryIso: action.payload.phoneCountryIso,
        });
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
        state.otpSession = null;

        if (action.payload.kind === 'authenticated') {
          state.accessToken = action.payload.session.accessToken;
          state.refreshToken = action.payload.session.refreshToken;
          state.user = action.payload.session.user;
          state.isAuthenticated = true;
          state.isGuest = false;

          const next = resolveNextAuthJourneyStep(action.payload.session.user);
          if (next) {
            state.authJourney = mergeAuthJourney(state.authJourney, {
              ...next,
              email: action.payload.session.user.email,
              phone: action.payload.session.user.phone,
            });
          } else {
            state.authJourney = null;
          }
          return;
        }

        state.user = action.payload.user;
        state.isAuthenticated = false;
        state.isGuest = false;
        state.authJourney = mergeAuthJourney(state.authJourney, {
          step: action.payload.nextStep === 'phone' ? 'link_phone' : 'link_email',
          email: action.payload.user.email,
          phone: action.payload.user.phone,
          primaryChannel: state.authJourney?.primaryChannel ?? 'whatsapp',
        });
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          'OTP verification failed';
      })
      .addCase(loadStoredSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.accessToken);

        if (state.isAuthenticated && action.payload.user) {
          const next = resolveNextAuthJourneyStep(action.payload.user);
          state.authJourney = next ? mergeAuthJourney(null, next) : null;
        } else {
          state.authJourney = null;
        }
      })
      .addCase(logoutUser.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isGuest = false;
        state.otpSession = null;
        state.authJourney = null;
      });
  },
});

export const { continueAsGuest, logoutSuccess, updateAuthUser, setAuthJourney, clearAuthJourney } =
  authSlice.actions;
export default authSlice.reducer;
