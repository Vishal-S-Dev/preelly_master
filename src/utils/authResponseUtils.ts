import { AuthUserResponseDto, LoginResponseDTO } from '../data/dto/authDto';
import { LoginSession } from '../domain/models/AuthModel';
import { User } from '../domain/models/User';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function isAuthEnvelope(raw: Record<string, unknown>): boolean {
  return (
    typeof raw.message === 'string' ||
    raw.token != null ||
    raw.accessToken != null ||
    raw.jwt != null ||
    raw.verificationRequired != null ||
    raw.nextStep != null
  );
}

function pickUser(raw: Record<string, unknown>): AuthUserResponseDto | null {
  const direct = asRecord(raw.user);
  if (direct) {
    return direct as unknown as AuthUserResponseDto;
  }

  const nested = asRecord(raw.data);
  if (nested) {
    const nestedUser = asRecord(nested.user);
    if (nestedUser) {
      return nestedUser as unknown as AuthUserResponseDto;
    }
  }

  if (!isAuthEnvelope(raw) && (raw._id || raw.id)) {
    return raw as unknown as AuthUserResponseDto;
  }

  return null;
}

function coerceToken(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value != null && typeof value === 'number') {
    return String(value);
  }
  return '';
}

function pickToken(raw: Record<string, unknown>): string {
  const nested = asRecord(raw.data);
  const user = asRecord(raw.user) ?? asRecord(nested?.user);
  const token =
    raw.token ??
    raw.accessToken ??
    raw.access_token ??
    raw.jwt ??
    nested?.token ??
    nested?.accessToken ??
    nested?.access_token ??
    nested?.jwt ??
    user?.token ??
    user?.accessToken;
  return coerceToken(token);
}

/** React Native may only receive JWT via Set-Cookie (web also stores body.token). */
export function extractTokenFromResponseHeaders(
  headers?: Record<string, unknown> | null,
): string {
  if (!headers) {
    return '';
  }

  const setCookie =
    headers['set-cookie'] ??
    headers['Set-Cookie'] ??
    headers['set-cookie'.toLowerCase()];

  const cookies = Array.isArray(setCookie)
    ? setCookie.map(String)
    : setCookie
      ? [String(setCookie)]
      : [];

  for (const cookie of cookies) {
    const match =
      cookie.match(/(?:^|,\s*)(?:token|jwt)=([^;,\s]+)/i) ??
      cookie.match(/(?:^|,\s*)preelly_token=([^;,\s]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  const authHeader = headers.authorization ?? headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return '';
}

export function mapAuthUserDtoToUser(user: AuthUserResponseDto): User {
  const userId = String(user._id ?? (user as { id?: string }).id ?? '');
  return {
    id: userId,
    name: user.name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    phone: user.phone ?? '',
    avatar: user.avatar ?? undefined,
    role: user.role ?? 'user',
    isVerified: Boolean(user.isVerified),
    isProfileComplete: Boolean(user.isProfileComplete),
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    bio: '',
  };
}

export function mapLoginResponseToSession(response: LoginResponseDTO): LoginSession {
  const user = mapAuthUserDtoToUser(response.user);
  if (!response.token || !user.id) {
    throw new Error('Invalid authentication response from server.');
  }

  return {
    accessToken: response.token,
    refreshToken: response.token,
    isGuest: false,
    user,
  };
}

/** Normalizes verify/login API payloads from flat, wrapped, or cookie-only shapes. */
export function normalizeLoginResponse(
  raw: unknown,
  headers?: Record<string, unknown> | null,
): LoginResponseDTO {
  const body = asRecord(raw);
  if (!body) {
    throw new Error('Invalid authentication response from server.');
  }

  let token = pickToken(body);
  if (!token) {
    token = extractTokenFromResponseHeaders(headers);
  }

  const user = pickUser(body);
  const userId = String(user?._id ?? (user as { id?: string } | null)?.id ?? '');

  if (!token) {
    throw new Error('Authentication token missing in server response.');
  }
  if (!user || !userId) {
    throw new Error('User profile missing in server response. Please try again.');
  }

  const nested = asRecord(body.data);
  const message =
    (typeof body.message === 'string' && body.message) ||
    (typeof nested?.message === 'string' && nested.message) ||
    'Login successful';

  return {
    message,
    token,
    user: {
      _id: userId,
      name: user.name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      phone: user.phone ?? '',
      avatar: user.avatar ?? null,
      role: user.role ?? 'user',
      isVerified: Boolean(user.isVerified),
      isProfileComplete: Boolean(user.isProfileComplete),
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      adminRole: user.adminRole,
      permissions: user.permissions,
    },
  };
}

export type AuthVerifyOtpResult =
  | { kind: 'authenticated'; session: LoginSession }
  | {
      kind: 'verification_required';
      message: string;
      nextStep?: 'email' | 'phone';
      user: User;
    };

/**
 * Parses verify-otp like the web app: full session when token exists,
 * otherwise intermediate verification step (no JWT yet).
 */
export function parseAuthVerifyResponse(
  raw: unknown,
  headers?: Record<string, unknown> | null,
): AuthVerifyOtpResult {
  const body = asRecord(raw);
  if (!body) {
    throw new Error('Invalid authentication response from server.');
  }

  const userDto = pickUser(body);
  if (!userDto) {
    throw new Error('User profile missing in server response. Please try again.');
  }

  const user = mapAuthUserDtoToUser(userDto);
  let token = pickToken(body);
  if (!token) {
    token = extractTokenFromResponseHeaders(headers);
  }

  const verificationRequired = Boolean(body.verificationRequired);
  const nextStepRaw = body.nextStep;
  const nextStep =
    nextStepRaw === 'email' || nextStepRaw === 'phone' ? nextStepRaw : undefined;

  if (!token && (verificationRequired || nextStep)) {
    const message =
      (typeof body.message === 'string' && body.message) ||
      'Additional verification is required to continue.';
    return {
      kind: 'verification_required',
      message,
      nextStep,
      user,
    };
  }

  if (!token) {
    const inferredNextStep: 'email' | 'phone' | undefined = !user.isEmailVerified
      ? 'email'
      : !user.isPhoneVerified
        ? 'phone'
        : undefined;

    if (inferredNextStep) {
      const message =
        (typeof body.message === 'string' && body.message) ||
        'Additional verification is required to continue.';
      return {
        kind: 'verification_required',
        message,
        nextStep: inferredNextStep,
        user,
      };
    }
  }

  const loginResponse = normalizeLoginResponse(raw, headers);
  return {
    kind: 'authenticated',
    session: mapLoginResponseToSession(loginResponse),
  };
}
