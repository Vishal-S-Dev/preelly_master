export type AuthMode = 'login' | 'signup';
export type AuthChannel = 'email' | 'whatsapp';

export interface LoginRequestDTO {
  email: string;
  password: string;
}

/** Client OTP session — phone context stored for verify on signup. */
export interface SendOtpRequestDTO {
  mode: AuthMode;
  channel?: AuthChannel;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneCountryIso?: string;
}

export interface AuthUserResponseDto {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  adminRole?: unknown;
  permissions?: unknown;
}

export interface LoginResponseDTO {
  message: string;
  token: string;
  user: AuthUserResponseDto;
}

export interface VerifyOtpResponseDto {
  message?: string;
  token?: string;
  accessToken?: string;
  user?: AuthUserResponseDto;
  verificationRequired?: boolean;
  nextStep?: 'email' | 'phone';
  email?: string;
  phone?: string;
}

export interface SendOtpResponseDto {
  message?: string;
  email?: string;
  phone?: string;
  channel?: AuthChannel;
  requestId?: string;
  expiresInSeconds?: number;
}

export interface VerifyOtpRequestDto {
  otp: string;
  mode: AuthMode;
  channel?: AuthChannel;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneCountryIso?: string;
  /** FCM device token, attached best-effort so the backend can register it at login time. */
  deviceToken?: string;
}

export interface AppleSignInRequestDto {
  identityToken: string;
  authorizationCode: string;
  /** Apple only returns name/email on the FIRST authorization for a given app — omit fields it withholds. */
  user?: {
    name?: string;
    email?: string;
  };
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export function toSendOtpApiPayload(request: SendOtpRequestDTO): Record<string, string> {
  const channel = request.channel ?? 'email';

  if (channel === 'whatsapp') {
    return {
      phone: request.phone ?? '',
      phoneCountryCode: request.phoneCountryCode ?? '',
      phoneCountryIso: request.phoneCountryIso ?? '',
      mode: request.mode,
      channel: 'whatsapp',
    };
  }

  return {
    email: request.email?.trim() ?? '',
    mode: request.mode,
    channel: 'email',
  };
}

export function toVerifyOtpApiPayload(request: VerifyOtpRequestDto): Record<string, string> {
  const channel = request.channel ?? 'email';

  if (channel === 'whatsapp') {
    const whatsappPayload: Record<string, string> = {
      otp: request.otp,
      phone: request.phone ?? '',
      phoneCountryCode: request.phoneCountryCode ?? '',
      phoneCountryIso: request.phoneCountryIso ?? '',
      mode: request.mode,
      channel: 'whatsapp',
    };
    if (request.deviceToken) {
      whatsappPayload.deviceToken = request.deviceToken;
    }
    return whatsappPayload;
  }

  const payload: Record<string, string> = {
    otp: request.otp,
    email: request.email?.trim().toLowerCase() ?? '',
    mode: request.mode,
    channel: 'email',
  };

  if (request.phone) {
    payload.phone = request.phone;
  }
  if (request.phoneCountryCode) {
    payload.phoneCountryCode = request.phoneCountryCode;
  }
  if (request.phoneCountryIso) {
    payload.phoneCountryIso = request.phoneCountryIso;
  }
  if (request.deviceToken) {
    payload.deviceToken = request.deviceToken;
  }

  return payload;
}

