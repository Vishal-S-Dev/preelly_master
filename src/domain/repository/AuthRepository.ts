import { AuthSession, LoginSession, SendOtpResult } from '../models/AuthModel';
import {
  AppleSignInRequestDto,
  AttachChannelResponseDto,
  AttachEmailRequestDto,
  AttachPhoneRequestDto,
  CompleteVerifyEmailRequestDto,
  CompleteVerifyPhoneRequestDto,
  SendOtpRequestDTO,
  VerifyOtpRequestDto,
} from '../../data/dto/authDto';
import { AuthVerifyOtpResult } from '../../utils/authResponseUtils';

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginSession>;
  sendOtp(request: SendOtpRequestDTO): Promise<SendOtpResult>;
  verifyOtp(request: VerifyOtpRequestDto): Promise<AuthVerifyOtpResult>;
  attachEmail(request: AttachEmailRequestDto): Promise<AttachChannelResponseDto>;
  attachPhone(request: AttachPhoneRequestDto): Promise<AttachChannelResponseDto>;
  completeVerifyEmail(request: CompleteVerifyEmailRequestDto): Promise<AuthVerifyOtpResult>;
  completeVerifyPhone(request: CompleteVerifyPhoneRequestDto): Promise<AuthVerifyOtpResult>;
  signInWithGoogle(idToken: string): Promise<AuthVerifyOtpResult>;
  signInWithApple(request: AppleSignInRequestDto): Promise<AuthVerifyOtpResult>;
  refreshAccessToken(refreshToken: string): Promise<AuthSession>;
  getStoredAccessToken(): Promise<string | null>;
  getStoredRefreshToken(): Promise<string | null>;
  storeSession(session: AuthSession): Promise<void>;
  logout(): Promise<void>;
}
