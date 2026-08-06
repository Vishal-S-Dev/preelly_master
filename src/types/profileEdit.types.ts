import type { UserProfileDTO } from './userProfile.types';

export type GenderOption = 'male' | 'female' | 'prefer_not_to_say';

export interface UserLocation {
  id: string;
  label: string;
  city?: string;
  building?: string;
  apartment?: string;
  detailLocation?: string;
  latitude?: number;
  longitude?: number;
  fullAddress: string;
  isDefault: boolean;
}

export interface ProfileEditFormValues {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  gender: GenderOption;
}

export type UpdateProfilePayload = UserProfileDTO;

export interface LocationPayload {
  label: string;
  city?: string;
  building?: string;
  apartment?: string;
  detailLocation?: string;
  coordinates?: [number, number];
  isDefault?: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  branchName?: string;
  isPrimary: boolean;
}

export interface BankAccountPayload {
  bankName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  branchName?: string;
  isPrimary?: boolean;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expiry?: string;
  holderName?: string;
  nickname?: string;
  isPrimary: boolean;
}

export interface SavedCardPayload {
  /** Raw digits. Omit when editing without replacing the card number. */
  cardNumber?: string;
  expiry?: string;
  holderName?: string;
  nickname?: string;
  isPrimary?: boolean;
}
