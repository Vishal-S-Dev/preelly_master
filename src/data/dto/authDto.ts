
export interface SendOtpRequestDto {
  email: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface SendOtpRequestDTO {
  email: string;
  mobile: string;
  mode: string;
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

/** Password login and OTP verify share the same success payload. */
export interface LoginResponseDTO {
  message: string;
  token: string;
  user: AuthUserResponseDto;
}

export type VerifyOtpResponseDto = LoginResponseDTO;

export interface SendOtpResponseDto {
  requestId: string;
  expiresInSeconds: number;
}

export interface VerifyOtpRequestDto {
  email: string;
  otp: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}
