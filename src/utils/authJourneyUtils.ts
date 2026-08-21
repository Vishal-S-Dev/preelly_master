import { User } from '../domain/models/User';
import { AuthJourneyState } from '../types/authJourney.types';

export function isEmailVerifiedUser(user: Pick<User, 'isEmailVerified' | 'email'>): boolean {
  if (typeof user.isEmailVerified === 'boolean') {
    return user.isEmailVerified;
  }
  return Boolean(user.email?.trim());
}

export function isPhoneVerifiedUser(user: Pick<User, 'isPhoneVerified' | 'phone'>): boolean {
  if (typeof user.isPhoneVerified === 'boolean') {
    return user.isPhoneVerified;
  }
  return Boolean(user.phone?.trim());
}

/**
 * After OTP verify, decide whether user must link phone, link email, or finish auth.
 * Backend user flags drive existing vs new-user continuation.
 */
export function resolveNextAuthJourneyStep(
  user: User,
): Pick<AuthJourneyState, 'step'> | null {
  if (!isPhoneVerifiedUser(user)) {
    return { step: 'link_phone' };
  }
  if (!isEmailVerifiedUser(user)) {
    return { step: 'link_email' };
  }
  return null;
}

/**
 * Google/Apple sign-in should land straight on Home even if the user has no verified phone
 * yet — mobile verification is only enforced later, at the point of posting an ad (see
 * MainTabs' "Create" tab gate in AppNavigator.tsx), not as a login-blocking step like the
 * email/phone-OTP journey requires.
 */
export function resolveNextAuthJourneyStepForOAuth(
  user: User,
): Pick<AuthJourneyState, 'step'> | null {
  if (!isEmailVerifiedUser(user)) {
    return { step: 'link_email' };
  }
  return null;
}

export function mergeAuthJourney(
  current: AuthJourneyState | null,
  patch: Partial<AuthJourneyState>,
): AuthJourneyState {
  return {
    primaryChannel: patch.primaryChannel ?? current?.primaryChannel ?? 'email',
    step: patch.step ?? current?.step ?? 'primary_otp',
    email: patch.email ?? current?.email,
    phone: patch.phone ?? current?.phone,
    phoneCountryCode: patch.phoneCountryCode ?? current?.phoneCountryCode,
    phoneCountryIso: patch.phoneCountryIso ?? current?.phoneCountryIso,
  };
}
