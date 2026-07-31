import { AuthChannel } from '../data/dto/authDto';

/** Tracks multi-step OTP auth until email + phone are linked and profile is ready. */
export type AuthJourneyStep = 'primary_otp' | 'link_phone' | 'link_email' | 'secondary_otp';

export interface AuthJourneyState {
  primaryChannel: AuthChannel;
  step: AuthJourneyStep;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneCountryIso?: string;
}
