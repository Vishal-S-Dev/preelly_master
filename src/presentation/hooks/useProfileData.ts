import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../../domain/models/Product';
import { User } from '../../domain/models/User';
import { profileService } from '../../services/profile.service';
import {
  ProfileProductGridItem,
  ProfileTabKey,
  ProfileUserView,
} from '../../types/profile.types';
import { getDisplayAvatarUri, resolveMediaUrl } from '../../utils/mediaUrl';
import { resolveProfileStatsFromDto } from '../../utils/profileStatsUtils';
import { isProfileIdentityVerified } from '../screens/profile/edit/utils/identityVerificationUtils';
import { useAppSelector } from './useRedux';

const PAGE_SIZE = 18;

type ProfileTabCache = {
  items: ProfileProductGridItem[];
  reelProducts: Product[];
  page: number;
  hasMore: boolean;
};

const mergeById = <T extends { id: string }>(
  prev: T[],
  incoming: T[],
  replace: boolean,
): { merged: T[]; addedCount: number } => {
  if (replace) {
    return { merged: incoming, addedCount: incoming.length };
  }
  const seen = new Set(prev.map(item => item.id));
  const added = incoming.filter(item => !seen.has(item.id));
  return { merged: [...prev, ...added], addedCount: added.length };
};

const DEFAULT_BIO = [
  'Your Dream Car Starts Here 🚗',
  'Best Deals | Verified Cars ✓',
];

const DEFAULT_STATS = { adsPosted: 0, followers: 0, following: 0 };

const parseBioLines = (bio?: string): string[] => {
  if (!bio?.trim()) {
    return DEFAULT_BIO;
  }
  const lines = bio
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  return lines.length ? lines : DEFAULT_BIO;
};

const resolveProfileAvatar = (
  avatar?: string | null,
  name?: string | null,
): string | undefined => getDisplayAvatarUri(avatar, name) ?? undefined;

const mapAuthToProfile = (
  authUser: User | null,
  stats = DEFAULT_STATS,
): ProfileUserView => ({
  id: authUser?.id ?? 'local_user',
  name: authUser?.name ?? 'User',
  avatar: resolveProfileAvatar(authUser?.avatar, authUser?.name),
  bioLines: DEFAULT_BIO,
  isVerified: Boolean(authUser?.isVerified),
  rating: { value: 0, totalRatings: 0 },
  stats,
});

export const useProfileData = (initialTab: ProfileTabKey = 'liked') => {
  const authUser = useAppSelector(state => state.auth.user);
  const userId = authUser?.id ?? null;

  const [profile, setProfile] = useState<ProfileUserView | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(initialTab);
  const [items, setItems] = useState<ProfileProductGridItem[]>([]);
  const [reelProducts, setReelProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const tabCacheRef = useRef<Partial<Record<ProfileTabKey, ProfileTabCache>>>({});
  const activeTabRef = useRef<ProfileTabKey>(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const loadProfileMeta = useCallback(async () => {
    if (!userId) {
      setProfile(mapAuthToProfile(authUser));
      return;
    }

    try {
      // `GET /api/user/profile` (no id) never computes `stats` server-side, so `adsPosted` below
      // would silently fall back to the current page's listings length — capped at PAGE_SIZE and
      // never the true total once someone has more ads than that. `GET /api/user/:id/profile`
      // does run the real aggregation, and it's exactly what the web app calls even for your own
      // profile (`selfMode` still hits the id-based route) — so mirror that here.
      const profileDto = await profileService.getUserProfile(userId);
      // `Promise.all` fails atomically — an unrelated hiccup in the listings fetch would reject
      // the whole batch and, via the catch block below, reset followers/following to 0 even
      // though they were fetched successfully. `allSettled` keeps each count independent so one
      // flaky call can't wipe out the other two.
      // Always hit the dedicated followers/following endpoints — `profileDto.followers`/
      // `.following` are raw id arrays on the user document that can drift out of sync with the
      // real Follow relationships (confirmed: a profile can report `followers: []` while the
      // dedicated endpoint for the same user correctly returns a non-zero count).
      const [listingsResult, followersResult, followingResult] = await Promise.allSettled([
        profileService.getUserListings(userId, 1, PAGE_SIZE),
        profileService.getFollowersCount(userId),
        profileService.getFollowingCount(userId),
      ]);

      // On a rejection, keep whatever was already displayed rather than hardcoding 0 — this
      // refetches on every screen focus, so a single flaky request on a live/shared backend must
      // never visibly regress an already-correct count down to zero.
      const listingsCount =
        listingsResult.status === 'fulfilled'
          ? listingsResult.value.items.length
          : profile?.stats.adsPosted ?? 0;
      const followersCount =
        followersResult.status === 'fulfilled'
          ? followersResult.value
          : profile?.stats.followers ?? 0;
      const followingCount =
        followingResult.status === 'fulfilled'
          ? followingResult.value
          : profile?.stats.following ?? 0;

      const bio = profileDto.bio;
      const identityVerificationStatus = profileDto.identityVerificationStatus ?? null;
      const identityVerifiedAt = profileDto.identityVerifiedAt ?? null;
      const legacyVerified = Boolean(
        profileDto.isVerified ?? profileDto.verified ?? authUser?.isVerified,
      );
      const stats = resolveProfileStatsFromDto(profileDto, {
        listingsCount,
        followersCount,
        followingCount,
      });

      setProfile({
        id: profileDto._id ?? profileDto.id ?? userId,
        name: profileDto.name ?? authUser?.name ?? 'User',
        username: profileDto.username,
        avatar: resolveProfileAvatar(
          profileDto.avatar ?? authUser?.avatar,
          profileDto.name ?? authUser?.name,
        ),
        bio,
        bioLines: parseBioLines(bio),
        identityVerificationStatus,
        identityVerifiedAt,
        isVerified: isProfileIdentityVerified({
          identityVerificationStatus,
          identityVerifiedAt,
          isVerified: legacyVerified,
        }),
        rating: {
          value: profileDto.rating ?? 0,
          totalRatings: profileDto.ratingsCount ?? profileDto.ratingCount ?? 0,
        },
        stats,
      });
    } catch {
      setProfile(mapAuthToProfile(authUser));
    }
  }, [authUser, profile, userId]);

  const fetchTabItems = useCallback(
    async (tab: ProfileTabKey, nextPage: number, replace: boolean) => {
      if (!userId && tab !== 'liked') {
        return { rows: [] as ProfileProductGridItem[], reelRows: [] as Product[], more: false };
      }

      let result = { items: [] as ProfileProductGridItem[], products: [] as Product[], hasMore: false };
      if (tab === 'posts') {
        result = await profileService.getUserListings(userId ?? 'local', nextPage, PAGE_SIZE);
      } else if (tab === 'saved') {
        result = await profileService.getSavedProducts(nextPage, PAGE_SIZE);
      } else {
        result = await profileService.getLikedProducts(nextPage, PAGE_SIZE);
      }

      return { rows: result.items, reelRows: result.products, more: result.hasMore };
    },
    [userId],
  );

  const applyTabCache = useCallback((tab: ProfileTabKey) => {
    const cached = tabCacheRef.current[tab];
    if (!cached) {
      return false;
    }
    setItems(cached.items);
    setReelProducts(cached.reelProducts);
    setPage(cached.page);
    setHasMore(cached.hasMore);
    setLoading(false);
    return true;
  }, []);

  const loadItems = useCallback(
    async (
      tab: ProfileTabKey,
      nextPage = 1,
      replace = true,
      options?: { background?: boolean },
    ) => {
      const cached = tabCacheRef.current[tab];
      const showBlockingLoader = replace && !options?.background && !cached;

      if (showBlockingLoader) {
        setLoading(true);
        setItems([]);
        setReelProducts([]);
        setPage(1);
      } else if (!replace) {
        setLoadingMore(true);
      } else if (replace && options?.background) {
        setLoading(false);
      }

      try {
        const { rows, reelRows, more } = await fetchTabItems(tab, nextPage, replace);
        const previousItems = tabCacheRef.current[tab]?.items ?? [];
        const previousReels = tabCacheRef.current[tab]?.reelProducts ?? [];
        const { merged: mergedItems, addedCount } = mergeById(previousItems, rows, replace);
        const { merged: mergedReels } = mergeById(previousReels, reelRows, replace);
        const nextHasMore = more && (replace || addedCount > 0);

        tabCacheRef.current[tab] = {
          items: mergedItems,
          reelProducts: mergedReels,
          page: nextPage,
          hasMore: nextHasMore,
        };

        if (activeTabRef.current === tab) {
          setItems(mergedItems);
          setReelProducts(mergedReels);
          setPage(nextPage);
          setHasMore(nextHasMore);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchTabItems],
  );

  // `Profile` is a bottom-tab screen React Navigation keeps mounted across tab switches, so a
  // plain mount effect would only ever fetch this once for the tab's entire lifetime — any
  // follower/following change made elsewhere (someone follows you while you're on another tab)
  // would never show up without a manual pull-to-refresh. Refetching on every focus keeps the
  // counts (and avatar/bio/verification) current without disturbing the separately-cached grid
  // items below, which intentionally keep their own per-tab cache.
  useFocusEffect(
    useCallback(() => {
      loadProfileMeta();
    }, [loadProfileMeta]),
  );

  useEffect(() => {
    const hasCachedTab = applyTabCache(activeTab);
    loadItems(activeTab, 1, true, { background: hasCachedTab });
  }, [activeTab, applyTabCache, loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    delete tabCacheRef.current[activeTab];
    await loadProfileMeta();
    await loadItems(activeTab, 1, true);
  }, [activeTab, loadItems, loadProfileMeta]);

  const setAvatarPreview = useCallback(
    (avatar: string | null) => {
      const resolved = avatar
        ? resolveMediaUrl(avatar) || avatar
        : getDisplayAvatarUri(null, authUser?.name ?? profile?.name) ?? undefined;
      setProfile(prev => {
        const base = prev ?? mapAuthToProfile(authUser);
        return {
          ...base,
          avatar: resolved,
        };
      });
    },
    [authUser, profile?.name],
  );

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) {
      return;
    }
    loadItems(activeTab, page + 1, false);
  }, [activeTab, hasMore, loadItems, loading, loadingMore, page, refreshing]);

  const onTabChange = useCallback(
    (tab: ProfileTabKey) => {
      if (tab === activeTab) {
        return;
      }
      if (!applyTabCache(tab)) {
        setItems([]);
        setReelProducts([]);
        setLoading(true);
      }
      setActiveTab(tab);
    },
    [activeTab, applyTabCache],
  );

  const displayProfile = useMemo<ProfileUserView>(() => {
    const base = profile ?? mapAuthToProfile(authUser);
    const freshestAvatar = authUser?.avatar ?? base.avatar;
    return {
      ...base,
      avatar: resolveProfileAvatar(freshestAvatar, base.name) ?? base.avatar,
    };
  }, [authUser, profile]);

  return {
    profile: displayProfile,
    authUser,
    activeTab,
    items,
    reelProducts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    onTabChange,
    onRefresh,
    reloadProfileMeta: loadProfileMeta,
    onLoadMore,
    setAvatarPreview,
  };
};
