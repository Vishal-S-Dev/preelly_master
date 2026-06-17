import { GenderOption } from '../../../../types/profileEdit.types';
import { UserProfileDTO } from '../../../../types/userProfile.types';

export const splitName = (fullName?: string): { firstName: string; lastName: string } => {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export const formatDobDisplay = (dob?: string | Date | null): string => {
  if (!dob) {
    return '';
  }
  const date = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseDobDisplayToApi = (display: string): string => {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return display;
  }
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
};

export const parseDobDisplayToDate = (display: string): Date | null => {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const mapApiGender = (gender?: string): GenderOption => {
  if (gender === 'male' || gender === 'female') {
    return gender;
  }
  return 'prefer_not_to_say';
};

export const mapProfileToForm = (profile: UserProfileDTO, authName?: string) => {
  const fromName = splitName(profile.name ?? authName);
  return {
    firstName: profile.firstName ?? fromName.firstName,
    lastName: profile.lastName ?? fromName.lastName,
    dateOfBirth: formatDobDisplay(profile.dob),
    nationality: profile.nationality ?? profile.address?.country ?? '',
    gender: mapApiGender(profile.gender),
  };
};
