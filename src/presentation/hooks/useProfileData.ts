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

const formatCount = (value: number): string => {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(value);
};

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
  followers: number,
  following: number,
  adsPosted: number,
): ProfileUserView => ({
  id: authUser?.id ?? 'local_user',
  name: authUser?.name ?? 'Apsar Shaikh',
  avatar: resolveProfileAvatar(authUser?.avatar, authUser?.name),
  bioLines: DEFAULT_BIO,
  isVerified: Boolean(authUser?.isVerified) ?? true,
  rating: { value: 4.5, totalRatings: 7 },
  stats: {
    adsPosted: adsPosted || 45,
    followers,
    following,
  },
});

export const useProfileData = () => {
  const authUser = useAppSelector(state => state.auth.user);
  const userId = authUser?.id ?? null;

  const [profile, setProfile] = useState<ProfileUserView | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('liked');
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
      setProfile(mapAuthToProfile(authUser, 5500, 25, 45));
      return;
    }

    try {
      const [profileDto, followers, following, listings] = await Promise.all([
        profileService.getCurrentUserProfile(),
        profileService.getFollowersCount(userId),
        profileService.getFollowingCount(userId),
        profileService.getUserListings(userId, 1, PAGE_SIZE),
      ]);

      const bio = profileDto.bio;
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
        isVerified: Boolean(profileDto.isVerified ?? profileDto.verified ?? authUser?.isVerified),
        rating: {
          value: profileDto.rating ?? 4.5,
          totalRatings: profileDto.ratingsCount ?? profileDto.ratingCount ?? 7,
        },
        stats: {
          adsPosted: listings.items.length || 45,
          followers,
          following,
        },
      });
    } catch {
      setProfile(mapAuthToProfile(authUser, 5500, 25, 45));
    }
  }, [authUser, userId]);

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

  useEffect(() => {
    loadProfileMeta();
  }, [loadProfileMeta]);

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
        const base = prev ?? mapAuthToProfile(authUser, 5500, 25, 45);
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

  const statsFormatted = useMemo(
    () => ({
      adsPosted: formatCount(profile?.stats.adsPosted ?? 0),
      followers: formatCount(profile?.stats.followers ?? 0),
      following: formatCount(profile?.stats.following ?? 0),
    }),
    [profile?.stats],
  );

  const displayProfile = useMemo<ProfileUserView>(() => {
    const base = profile ?? mapAuthToProfile(authUser, 5500, 25, 45);
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
    statsFormatted,
    onTabChange,
    onRefresh,
    reloadProfileMeta: loadProfileMeta,
    onLoadMore,
    setAvatarPreview,
  };
};
