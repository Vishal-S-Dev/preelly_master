import { STORAGE_KEYS } from '../../constants/appConstants';
import { AuthSession, LoginSession, SendOtpResult } from '../../domain/models/AuthModel';
import { AuthRepository } from '../../domain/repository/AuthRepository';
import { LoginResponseDTO, SendOtpRequestDTO } from '../dto/authDto';
import { storage } from '../../utils/storage';
import { authApi } from '../api/authApi';

export class AuthRepositoryImpl implements AuthRepository {
  private mapLoginResponseToSession(response: LoginResponseDTO): LoginSession {
    return {
      accessToken: response.token,
      refreshToken: response.token,
      isGuest: false,
      user: {
        id: response.user._id,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone ?? '',
        avatar: response.user.avatar ?? undefined,
        role: response.user.role,
        isVerified: response.user.isVerified,
        isProfileComplete: response.user.isProfileComplete,
        bio: '',
      },
    };
  }

  async login(email: string, password: string): Promise<LoginSession> {
    const response = await authApi.login({ email, password });
    return this.mapLoginResponseToSession(response);
  }

  async sendOtp(request: SendOtpRequestDTO): Promise<SendOtpResult> {
    return authApi.sendOtp(request);
  }

  async verifyOtp(email: string, otp: string): Promise<LoginSession> {
    const response = await authApi.verifyOtp({ email, otp });
    return this.mapLoginResponseToSession(response);
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
