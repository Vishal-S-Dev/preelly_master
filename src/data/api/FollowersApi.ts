import { ENV } from '../../constants/env';
import { httpClient } from './httpClient';
import { FollowersListResponse, ShareRecipient } from '../../types/share.types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const API_BASE = ENV.API_BASE_URL;

const mapFollower = (item: unknown, index: number): ShareRecipient | null => {
  if (typeof item === 'string' && item.trim()) {
    return {
      id: item,
      name: 'User',
      username: item.slice(-6),
      avatarUrl: undefined,
    };
  }
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = String(row._id ?? row.id ?? '');
  if (!id) {
    return null;
  }
  const name = String(row.name ?? row.displayName ?? row.username ?? 'User');
  const username = String(row.username ?? row.name ?? `user_${index}`);
  const avatarRaw = row.avatar ?? row.profileImage ?? row.image;
  const avatarUrl =
    typeof avatarRaw === 'string' && avatarRaw.trim()
      ? resolveMediaUrl(avatarRaw.trim())
      : undefined;
  return {
    id,
    name,
    username: username.startsWith('@') ? username.slice(1) : username,
    avatarUrl: avatarUrl || undefined,
    isOnline: Boolean(row.isOnline ?? row.online),
  };
};

export const FollowersApi = {
  async getFollowers(userId: string): Promise<ShareRecipient[]> {
    const { data } = await httpClient.get<FollowersListResponse>(
      `/api/user/${userId}/followers`,
      { baseURL: API_BASE },
    );
    const list = Array.isArray(data?.followers) ? data.followers : [];
    return list
      .map((item, index) => mapFollower(item, index))
      .filter((item): item is ShareRecipient => item !== null);
  },

  async getFollowing(userId: string): Promise<ShareRecipient[]> {
    const { data } = await httpClient.get<{ following?: unknown[] }>(
      `/api/user/${userId}/following`,
      { baseURL: API_BASE },
    );
    const list = Array.isArray(data?.following) ? data.following : [];
    return list
      .map((item, index) => mapFollower(item, index))
      .filter((item): item is ShareRecipient => item !== null);
  },
};
