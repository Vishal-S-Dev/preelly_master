import { useCallback, useEffect, useState } from 'react';
import { ChatApi } from '../../data/api/ChatApi';
import { ChatDocumentDTO, ChatUserRefDTO } from '../../data/dto/ChatDTO';
import { ShareRecipient } from '../../types/share.types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const resolveGroupAvatar = (avatar?: string | null): string | undefined => {
  const trimmed = avatar?.trim();
  return trimmed ? resolveMediaUrl(trimmed) || undefined : undefined;
};

const participantRefId = (p: ChatUserRefDTO | string): string =>
  typeof p === 'string' ? p : p._id;

const participantAvatar = (p: ChatUserRefDTO | string): string | undefined =>
  typeof p === 'string' ? undefined : resolveGroupAvatar(p.avatar);

const mapGroupChat = (chat: ChatDocumentDTO, viewerId: string | null): ShareRecipient => {
  const participants = chat.participants ?? [];
  const others = viewerId ? participants.filter(p => participantRefId(p) !== viewerId) : participants;
  // Up to 2 other members' avatars drive the Instagram-style overlapping-circles icon (see
  // ShareUserGridItem) — falls back to the group's own dedicated avatar/initial if none resolve.
  const groupAvatarUrls = others
    .map(participantAvatar)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 2);

  return {
    id: chat._id,
    name: chat.name?.trim() || 'Group',
    username: '',
    avatarUrl: resolveGroupAvatar(chat.groupAvatar) ?? groupAvatarUrls[0],
    kind: 'group',
    memberCount: participants.length,
    groupAvatarUrls,
  };
};

/** Existing group chats the viewer is part of — shown as share destinations, mirroring web's
 * "Groups" section (posts directly into the group, never creates a new chat). */
export const useShareGroups = (enabled: boolean, viewerId: string | null) => {
  const [groups, setGroups] = useState<ShareRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chats = await ChatApi.getChats();
      setGroups(
        chats.filter(chat => chat.type === 'group').map(chat => mapGroupChat(chat, viewerId)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [viewerId]);

  useEffect(() => {
    if (!enabled) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }
    void load();
  }, [enabled, load]);

  return { groups, loading, error, retry: load };
};
