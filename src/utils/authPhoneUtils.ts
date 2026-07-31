import { CountryDialCode } from '../constants/countryDialCodes';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export type AuthMode = 'login' | 'signup';
export type AuthChannel = 'email' | 'whatsapp';

export function isValidAuthEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function stripPhoneDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/** Builds full international phone digits and metadata (matches web app). */
export function formatAuthPhone(
  country: CountryDialCode,
  rawPhone: string,
): {
  phone: string;
  phoneCountryCode: string;
  phoneCountryIso: string;
} {
  const phoneDigits = stripPhoneDigits(rawPhone);
  const dialDigits = stripPhoneDigits(country.dialCode);
  const phone = phoneDigits ? `${dialDigits}${phoneDigits}` : '';
  return {
    phone,
    phoneCountryCode: country.dialCode,
    phoneCountryIso: country.iso,
  };
}

/** Display format per design: +971 5677 1129 */
export function formatDisplayPhone(
  phoneCountryCode: string,
  phoneDigits: string,
): string {
  const dial = phoneCountryCode.startsWith('+') ? phoneCountryCode : `+${phoneCountryCode}`;
  const allDigits = stripPhoneDigits(phoneDigits);
  const dialDigits = stripPhoneDigits(dial);
  const local =
    allDigits.startsWith(dialDigits) && dialDigits
      ? allDigits.slice(dialDigits.length)
      : allDigits;

  if (!local) {
    return dial;
  }

  if (local.length <= 4) {
    return `${dial} ${local}`;
  }

  const head = local.slice(0, 4);
  const tail = local.slice(4);
  return `${dial} ${head} ${tail}`;
}

export function validateSignupPhone(rawPhone: string): string | null {
  const digits = stripPhoneDigits(rawPhone);
  if (!digits) {
    return 'Phone number is required';
  }
  if (digits.length < 7) {
    return 'Enter a valid phone number';
  }
  return null;
}

export function validateLoginPhone(rawPhone: string): string | null {
  const digits = stripPhoneDigits(rawPhone);
  if (!digits) {
    return 'Mobile number is required';
  }
  if (digits.length < 6) {
    return 'Please enter a valid mobile number';
  }
  return null;
}
