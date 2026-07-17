import { ProfileStats } from '../types/profile.types';
import { UserProfileDTO } from '../types/userProfile.types';

export const formatProfileStatCount = (value: number): string => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

  if (safeValue >= 1_000_000) {
    const millions = safeValue / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }

  if (safeValue >= 1000) {
    const thousands = safeValue / 1000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }

  return String(safeValue);
};

export const resolveProfileStatsFromDto = (
  profileDto: UserProfileDTO,
  options?: {
    listingsCount?: number;
    followersCount?: number;
    followingCount?: number;
  },
): ProfileStats => {
  const followers = Array.isArray(profileDto.followers)
    ? profileDto.followers.length
    : options?.followersCount ?? 0;

  const following = Array.isArray(profileDto.following)
    ? profileDto.following.length
    : options?.followingCount ?? 0;

  const adsPosted =
    profileDto.stats?.totalProducts ?? options?.listingsCount ?? 0;

  return {
    adsPosted: Math.max(0, adsPosted),
    followers: Math.max(0, followers),
    following: Math.max(0, following),
  };
};
