import { User } from './User';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  isGuest: boolean;
}

export interface SendOtpResult {
  requestId: string;
  expiresInSeconds: number;
}

export interface LoginSession extends AuthSession {
  user: User;
}
