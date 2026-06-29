import { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '../../domain/models/Product';
import { profileService } from '../../services/profile.service';
import { ProfileApiUserDTO } from '../../services/profile.service';
import {
  ProfileFollowState,
  ProfileProductGridItem,
  ProfileUserView,
} from '../../types/profile.types';
import { UserFollowStatus } from '../../types/userProfile.types';
import { useAppSelector } from './useRedux';

const PAGE_SIZE = 18;

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

const DEFAULT_BIO = ['No bio yet.'];

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

const resolveInitialFollowState = (
  profileDto: ProfileApiUserDTO,
  viewerUserId?: string,
): ProfileFollowState => {
  if (profileDto.relationship) {
    return {
      following: Boolean(profileDto.relationship.following),
      pending: Boolean(profileDto.relationship.pending),
      status: profileDto.relationship.status,
    };
  }

  if (typeof profileDto.isFollowing === 'boolean') {
    return {
      following: profileDto.isFollowing,
      pending: profileDto.followStatus === 'pending',
      status: profileDto.followStatus,
    };
  }

  const isFollowing =
    Boolean(viewerUserId) &&
    Array.isArray(profileDto.followers) &&
    profileDto.followers.includes(viewerUserId as string);

  return {
    following: isFollowing,
    pending: false,
    status: isFollowing ? 'active' : 'none',
  };
};

export const mapFollowStatusToState = (status?: UserFollowStatus | string): ProfileFollowState => {
  switch (status) {
    case 'active':
      return { following: true, pending: false, status: 'active' };
    case 'pending':
      return { following: false, pending: true, status: 'pending' };
    case 'blocked':
      return { following: false, pending: false, status: 'blocked' };
    case 'self':
      return { following: false, pending: false, status: 'self' };
    default:
      return { following: false, pending: false, status: 'none' };
  }
};

const emptyProfile = (userId: string): ProfileUserView => ({
  id: userId,
  name: 'User',
  bioLines: DEFAULT_BIO,
  isVerified: false,
  rating: { value: 0, totalRatings: 0 },
  stats: { adsPosted: 0, followers: 0, following: 0 },
  followState: { following: false, pending: false, status: 'none' },
});

export const useOtherUserProfileData = (userId: string) => {
  const viewerUserId = useAppSelector(state => state.auth.user?.id);
  const [profile, setProfile] = useState<ProfileUserView | null>(null);
  const [items, setItems] = useState<ProfileProductGridItem[]>([]);
  const [reelProducts, setReelProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = Boolean(viewerUserId && viewerUserId === userId);

  const loadFollowStatus = useCallback(async () => {
    if (!userId || isOwnProfile || !viewerUserId) {
      return;
    }

    setFollowStatusLoading(true);
    try {
      const { status } = await profileService.getFollowStatus(userId);
      const followState = mapFollowStatusToState(status);
      setProfile(current => {
        if (!current) {
          return current;
        }
        return { ...current, followState };
      });
    } catch {
      // Keep profile-derived follow state as fallback.
    } finally {
      setFollowStatusLoading(false);
    }
  }, [isOwnProfile, userId, viewerUserId]);

  const loadProfileMeta = useCallback(async () => {
    if (!userId) {
      setError('Missing user id');
      setProfile(emptyProfile(''));
      return;
    }

    try {
      const profileDto = await profileService.getUserProfile(userId);
      const followState = resolveInitialFollowState(profileDto, viewerUserId);
      const followerCount = Array.isArray(profileDto.followers)
        ? profileDto.followers.length
        : await profileService.getFollowersCount(userId);
      const followingCount = Array.isArray(profileDto.following)
        ? profileDto.following.length
        : await profileService.getFollowingCount(userId);

      setProfile({
        id: profileDto._id ?? profileDto.id ?? userId,
        name: profileDto.name ?? profileDto.displayName ?? 'User',
        username: profileDto.username,
        avatar: profileDto.avatar ?? undefined,
        bio: profileDto.bio,
        bioLines: parseBioLines(profileDto.bio),
        isVerified: Boolean(profileDto.isVerified ?? profileDto.verified),
        rating: {
          value: profileDto.rating ?? 0,
          totalRatings: profileDto.ratingsCount ?? profileDto.ratingCount ?? 0,
        },
        stats: {
          adsPosted: profileDto.stats?.totalProducts ?? 0,
          followers: followerCount,
          following: followingCount,
        },
        followState,
      });
      setError(null);
    } catch {
      setError('Could not load profile');
      setProfile(emptyProfile(userId));
    }
  }, [userId, viewerUserId]);

  const loadPosts = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!userId) {
        return;
      }

      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await profileService.getUserListings(userId, nextPage, PAGE_SIZE);
        let addedCount = 0;
        setItems(prev => {
          const { merged, addedCount: count } = mergeById(prev, result.items, replace);
          addedCount = count;
          return merged;
        });
        setReelProducts(prev => mergeById(prev, result.products, replace).merged);
        setPage(nextPage);
        setHasMore(result.hasMore && (replace || addedCount > 0));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadProfileMeta();
    loadPosts(1, true);
  }, [loadProfileMeta, loadPosts]);

  useEffect(() => {
    void loadFollowStatus();
  }, [loadFollowStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfileMeta(), loadFollowStatus()]);
    await loadPosts(1, true);
  }, [loadFollowStatus, loadPosts, loadProfileMeta]);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) {
      return;
    }
    loadPosts(page + 1, false);
  }, [hasMore, loadPosts, loading, loadingMore, page, refreshing]);

  const toggleFollow = useCallback(async () => {
    if (!userId || followLoading || followStatusLoading || isOwnProfile) {
      return;
    }

    const previousFollowState = profile?.followState ?? {
      following: false,
      pending: false,
      status: 'none',
    };

    if (previousFollowState.status === 'blocked') {
      return;
    }

    const previousFollowers = profile?.stats.followers ?? 0;
    const isConnected = previousFollowState.following || previousFollowState.pending;
    const optimisticFollowState: ProfileFollowState = isConnected
      ? { following: false, pending: false, status: 'none' }
      : { following: false, pending: true, status: 'pending' };
    const followerDelta = previousFollowState.following ? -1 : 0;

    setFollowLoading(true);
    setProfile(current => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        followState: optimisticFollowState,
        stats: {
          ...current.stats,
          followers: Math.max(0, current.stats.followers + followerDelta),
        },
      };
    });

    try {
      const response = await profileService.toggleFollow(userId);
      const nextFollowState = mapFollowStatusToState(response.status);
      setProfile(current => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          followState: nextFollowState,
          stats: {
            ...current.stats,
            followers:
              typeof response.followerCount === 'number'
                ? response.followerCount
                : current.stats.followers,
            following:
              typeof response.followingCount === 'number'
                ? response.followingCount
                : current.stats.following,
          },
        };
      });
    } catch {
      setProfile(current => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          followState: previousFollowState,
          stats: {
            ...current.stats,
            followers: previousFollowers,
          },
        };
      });
    } finally {
      setFollowLoading(false);
    }
  }, [
    followLoading,
    followStatusLoading,
    isOwnProfile,
    profile?.followState,
    profile?.stats.followers,
    userId,
  ]);

  const statsFormatted = useMemo(
    () => ({
      adsPosted: formatCount(profile?.stats.adsPosted ?? 0),
      followers: formatCount(profile?.stats.followers ?? 0),
      following: formatCount(profile?.stats.following ?? 0),
    }),
    [profile?.stats],
  );

  const followState = profile?.followState ?? {
    following: false,
    pending: false,
    status: 'none',
  };

  return {
    profile: profile ?? emptyProfile(userId),
    items,
    reelProducts,
    loading,
    refreshing,
    loadingMore,
    followLoading,
    followStatusLoading,
    followState,
    error,
    statsFormatted,
    onRefresh,
    onLoadMore,
    toggleFollow,
    isOwnProfile,
  };
};
