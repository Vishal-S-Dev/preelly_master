import { UserProfileDTO } from '../../../../types/userProfile.types';
import { ProfileEditFormValues } from '../../../../types/profileEdit.types';
import { parseDobDisplayToApi } from './profileEditUtils';

export const buildMergedProfilePayload = (
  existing: UserProfileDTO,
  values: ProfileEditFormValues,
): UserProfileDTO => {
  const name = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
  const nationality = values.nationality.trim();
  const gender =
    values.gender === 'prefer_not_to_say' ? existing.gender ?? null : values.gender;

  return {
    ...existing,
    name,
    gender,
    dob: parseDobDisplayToApi(values.dateOfBirth),
    address: {
      line1: existing.address?.line1 ?? null,
      line2: existing.address?.line2 ?? null,
      postalCode: existing.address?.postalCode ?? null,
      country: nationality || (existing.address?.country ?? null),
    },
    location: existing.location ?? {
      city: null,
      source: null,
      updatedAt: null,
    },
  };
};
