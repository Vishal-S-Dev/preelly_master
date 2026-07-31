import { STORAGE_KEYS } from '../../constants/appConstants';
import { AuthSession, LoginSession, SendOtpResult } from '../../domain/models/AuthModel';
import { AuthRepository } from '../../domain/repository/AuthRepository';
import {
  SendOtpRequestDTO,
  VerifyOtpRequestDto,
} from '../dto/authDto';
import { storage } from '../../utils/storage';
import { authApi } from '../api/authApi';
import {
  AuthVerifyOtpResult,
  mapLoginResponseToSession,
  normalizeLoginResponse,
} from '../../utils/authResponseUtils';

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<LoginSession> {
    const response = normalizeLoginResponse(await authApi.login({ email, password }));
    return mapLoginResponseToSession(response);
  }

  async sendOtp(request: SendOtpRequestDTO): Promise<SendOtpResult> {
    return authApi.sendOtp(request);
  }

  async verifyOtp(request: VerifyOtpRequestDto): Promise<AuthVerifyOtpResult> {
    return authApi.verifyOtp(request);
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthSession> {
    const response = await authApi.refreshToken({ refreshToken });
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isGuest: false,
    };
  }

  async getStoredAccessToken(): Promise<string | null> {
    return storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getStoredRefreshToken(): Promise<string | null> {
    return storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async storeSession(session: AuthSession): Promise<void> {
    await storage.setString(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
    await storage.setString(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
    if (this.isLoginSession(session)) {
      await storage.setString(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(session.user),
      );
    }
  }

  async logout(): Promise<void> {
    await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.remove(STORAGE_KEYS.USER_DATA);
  }

  private isLoginSession(session: AuthSession): session is LoginSession {
    return 'user' in session;
  }
}
