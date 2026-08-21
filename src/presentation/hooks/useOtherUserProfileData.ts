import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../../domain/models/Product';
import { profileService } from '../../services/profile.service';
import { ProfileApiUserDTO } from '../../services/profile.service';
import {
  ProfileFollowState,
  ProfileProductGridItem,
  ProfileUserView,
} from '../../types/profile.types';
import { UserFollowStatus } from '../../types/userProfile.types';
import { resolveProfileStatsFromDto } from '../../utils/profileStatsUtils';
import { isProfileIdentityVerified } from '../screens/profile/edit/utils/identityVerificationUtils';
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

  // `loadProfileMeta` reads this for its "keep the previous count on a failed refetch" fallback
  // instead of depending on `profile` state directly — `loadProfileMeta` itself calls
  // `setProfile`, so depending on `profile` would change its own identity every time it succeeds.
  // That resulting new identity flows into `useFocusEffect`'s memoized callback below, and
  // react-navigation's `useFocusEffect` re-invokes its callback immediately whenever that
  // identity changes while the screen is focused (see its source) — so the old code re-ran
  // `loadProfileMeta`/`loadFollowStatus` in an infinite loop for as long as this screen stayed
  // focused, which is why the Follow button's loading spinner never settled.
  const profileRef = useRef<ProfileUserView | null>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const isOwnProfile = Boolean(viewerUserId && viewerUserId === userId);

  const loadFollowStatus = useCallback(async () => {
    if (!userId || isOwnProfile || !viewerUserId) {
      return;
    }

    setFollowStatusLoading(true);
    try {
      const { status, blockedByMe } = await profileService.getFollowStatus(userId);
      const followState: ProfileFollowState = blockedByMe
        ? { following: false, pending: false, status: 'blocked' }
        : mapFollowStatusToState(status);
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
      const [profileDto, listings] = await Promise.all([
        profileService.getUserProfile(userId),
        profileService.getUserListings(userId, 1, PAGE_SIZE),
      ]);
      const followState = resolveInitialFollowState(profileDto, viewerUserId);
      // `getFollowersCount`/`getFollowingCount` intentionally throw on failure rather than
      // swallowing to 0 (see profile.service.ts) — settle them independently and fall back to
      // whatever was already displayed, so a single flaky request on refocus can't regress an
      // already-correct count down to zero, and can't take down the rest of the profile either.
      // Always hit the dedicated endpoints — `profileDto.followers`/`.following` are raw id
      // arrays on the user document that can drift out of sync with the real Follow
      // relationships (confirmed: a profile can report `followers: []` while the dedicated
      // endpoint for the same user correctly returns a non-zero count).
      const [followersResult, followingResult] = await Promise.allSettled([
        profileService.getFollowersCount(userId),
        profileService.getFollowingCount(userId),
      ]);
      const followerCount =
        followersResult.status === 'fulfilled'
          ? followersResult.value
          : profileRef.current?.stats.followers ?? 0;
      const followingCount =
        followingResult.status === 'fulfilled'
          ? followingResult.value
          : profileRef.current?.stats.following ?? 0;

      const identityVerificationStatus = profileDto.identityVerificationStatus ?? null;
      const identityVerifiedAt = profileDto.identityVerifiedAt ?? null;

      setProfile({
        id: profileDto._id ?? profileDto.id ?? userId,
        name: profileDto.name ?? profileDto.displayName ?? 'User',
        username: profileDto.username,
        avatar: profileDto.avatar ?? undefined,
        bio: profileDto.bio,
        bioLines: parseBioLines(profileDto.bio),
        identityVerificationStatus,
        identityVerifiedAt,
        isVerified: isProfileIdentityVerified({
          identityVerificationStatus,
          identityVerifiedAt,
          isVerified: Boolean(profileDto.isVerified ?? profileDto.verified),
        }),
        rating: {
          value: profileDto.rating ?? 0,
          totalRatings: profileDto.ratingsCount ?? profileDto.ratingCount ?? 0,
        },
        stats: resolveProfileStatsFromDto(profileDto, {
          listingsCount: listings.items.length,
          followersCount: followerCount,
          followingCount: followingCount,
        }),
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
    loadPosts(1, true);
  }, [loadPosts]);

  // This screen is pushed onto the root stack (e.g. from the Followers/Following list, or from
  // a reel/chat), which React Navigation keeps mounted underneath — popping back to it does NOT
  // remount the component, so a mount-only effect would only ever fetch once and go stale the
  // moment you follow/unfollow someone (from here or from the Followers/Following list) and come
  // back. Refetching on every focus keeps counts and follow state current, matching how the web
  // app effectively always "refetches" since every profile visit there is a fresh page load.
  useFocusEffect(
    useCallback(() => {
      // `loadFollowStatus` writes into `profile` via `setProfile(current => ...)`, which no-ops
      // while `profile` is still null — so it MUST run after `loadProfileMeta` has set the
      // initial profile, not in parallel, or its authoritative result gets silently dropped.
      void (async () => {
        await loadProfileMeta();
        await loadFollowStatus();
      })();
    }, [loadFollowStatus, loadProfileMeta]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileMeta();
    await loadFollowStatus();
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
            // `response.followingCount` is the VIEWER's own following count (how many people
            // *the viewer* follows after this toggle) — irrelevant to this profile's own
            // "Following" stat, which only changes when this profile follows/unfollows someone
            // else, never as a side effect of someone else following *them*. Only `followerCount`
            // (how many people follow this profile) is legitimately about this profile.
            followers:
              typeof response.followerCount === 'number'
                ? response.followerCount
                : current.stats.followers,
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
    onRefresh,
    onLoadMore,
    toggleFollow,
    isOwnProfile,
  };
};
