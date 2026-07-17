import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { CREATE_POST_DRAFT_KEY } from '../../constants/createPostConstants';
import { profileService } from '../../services/profile.service';
import { SettingsDashboardCounts, SettingsProfileSummary } from '../../types/settings.types';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';
import { storage } from '../../utils/storage';
import {
  isProfileIdentityVerified,
  resolveIdentityVerificationStatus,
} from '../screens/profile/edit/utils/identityVerificationUtils';
import { useAppSelector } from './useRedux';

const EMPTY_COUNTS: SettingsDashboardCounts = {
  ads: 0,
  searches: 0,
  bookings: 0,
  cart: 0,
  drafts: 0,
  archives: 0,
};

const parseRecentSearchCount = (raw: string | null): number => {
  if (!raw) {
    return 0;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const hasPersistedDraft = async (): Promise<boolean> => {
  try {
    const raw = await storage.getString(CREATE_POST_DRAFT_KEY);
    if (!raw?.trim()) {
      return false;
    }
    const parsed = JSON.parse(raw) as {
      state?: { title?: string; images?: unknown[]; video?: unknown };
      title?: string;
      images?: unknown[];
      video?: unknown;
    };
    const state = parsed.state ?? parsed;
    const title = typeof state.title === 'string' ? state.title.trim() : '';
    const images = Array.isArray(state.images) ? state.images.length : 0;
    const hasVideo = Boolean(state.video);
    return Boolean(title || images > 0 || hasVideo);
  } catch {
    return false;
  }
};

export const useMySettingsData = () => {
  const authUser = useAppSelector(state => state.auth.user);
  const userId = authUser?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SettingsProfileSummary>({
    id: userId ?? 'local_user',
    name: authUser?.name ?? 'User',
    avatar: getDisplayAvatarUri(authUser?.avatar, authUser?.name) ?? undefined,
    isVerified: false,
    verificationStatus: 'none',
  });
  const [counts, setCounts] = useState<SettingsDashboardCounts>(EMPTY_COUNTS);

  const load = useCallback(async () => {
    setLoading(true);

    const fallbackProfile: SettingsProfileSummary = {
      id: userId ?? 'local_user',
      name: authUser?.name ?? 'User',
      avatar: getDisplayAvatarUri(authUser?.avatar, authUser?.name) ?? undefined,
      isVerified: false,
      verificationStatus: 'none',
    };

    try {
      const [profileDto, listings, saved, recentRaw, draftExists] = await Promise.all([
        userId ? profileService.getCurrentUserProfile().catch(() => null) : Promise.resolve(null),
        userId ? profileService.getUserListings(userId, 1, 18).catch(() => null) : Promise.resolve(null),
        profileService.getSavedProducts(1, 18).catch(() => null),
        storage.getString(STORAGE_KEYS.RECENT_SEARCHES),
        hasPersistedDraft(),
      ]);

      const identityVerificationStatus = profileDto?.identityVerificationStatus ?? null;
      const identityVerifiedAt = profileDto?.identityVerifiedAt ?? null;
      const verificationStatus = resolveIdentityVerificationStatus({
        status: identityVerificationStatus,
        identityVerifiedAt,
      });
      const legacyVerified = Boolean(
        profileDto?.isVerified ?? profileDto?.verified ?? authUser?.isVerified,
      );

      setProfile({
        id: profileDto?._id ?? profileDto?.id ?? fallbackProfile.id,
        name: profileDto?.name ?? authUser?.name ?? fallbackProfile.name,
        avatar:
          getDisplayAvatarUri(profileDto?.avatar ?? authUser?.avatar, profileDto?.name ?? authUser?.name) ??
          undefined,
        verificationStatus,
        rejectionReason: profileDto?.identityVerificationRejectionReason ?? null,
        isVerified: isProfileIdentityVerified({
          identityVerificationStatus,
          identityVerifiedAt,
          isVerified: legacyVerified,
        }),
      });

      setCounts({
        ads: profileDto?.stats?.totalProducts ?? listings?.items.length ?? 0,
        searches: parseRecentSearchCount(recentRaw),
        bookings: 0,
        cart: saved?.items.length ?? 0,
        drafts: draftExists ? 1 : 0,
        archives: 0,
      });
    } catch {
      setProfile(fallbackProfile);
      setCounts(EMPTY_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [authUser?.avatar, authUser?.isVerified, authUser?.name, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    profile,
    counts,
    loading,
    reload: load,
  };
};
