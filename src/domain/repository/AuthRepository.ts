import { AuthSession, LoginSession, SendOtpResult } from '../models/AuthModel';
import { SendOtpRequestDTO } from '@/data/dto/authDto.ts';

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginSession>;
  sendOtp(request: SendOtpRequestDTO): Promise<SendOtpResult>;
  verifyOtp(email: SendOtpRequestDTO): Promise<LoginSession>;
  refreshAccessToken(refreshToken: string): Promise<AuthSession>;
  getStoredAccessToken(): Promise<string | null>;
  getStoredRefreshToken(): Promise<string | null>;
  storeSession(session: AuthSession): Promise<void>;
  logout(): Promise<void>;
}
