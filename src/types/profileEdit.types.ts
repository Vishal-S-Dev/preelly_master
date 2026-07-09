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
