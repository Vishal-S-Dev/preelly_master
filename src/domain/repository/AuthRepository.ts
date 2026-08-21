import { AuthSession, LoginSession, SendOtpResult } from '../models/AuthModel';
import {
  AppleSignInRequestDto,
  SendOtpRequestDTO,
  VerifyOtpRequestDto,
} from '../../data/dto/authDto';
import { AuthVerifyOtpResult } from '../../utils/authResponseUtils';

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginSession>;
  sendOtp(request: SendOtpRequestDTO): Promise<SendOtpResult>;
  verifyOtp(request: VerifyOtpRequestDto): Promise<AuthVerifyOtpResult>;
  signInWithGoogle(idToken: string): Promise<AuthVerifyOtpResult>;
  signInWithApple(request: AppleSignInRequestDto): Promise<AuthVerifyOtpResult>;
  refreshAccessToken(refreshToken: string): Promise<AuthSession>;
  getStoredAccessToken(): Promise<string | null>;
  getStoredRefreshToken(): Promise<string | null>;
  storeSession(session: AuthSession): Promise<void>;
  logout(): Promise<void>;
}
