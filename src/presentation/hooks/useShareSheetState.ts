import { useCallback, useMemo, useState } from 'react';
import { SharePayload, ShareRecipient, SocialSharePlatform } from '../../types/share.types';
import { shareService } from '../../services/share.service';
import { shareViaPlatform, copyShareLink } from '../../utils/shareSocial';
import { useShareFollowers } from './useShareFollowers';
import { useShareGroups } from './useShareGroups';
import { useShareUserSearch } from './useShareUserSearch';
import { useAppSelector } from './useRedux';

/**
 * Single source of truth for the whole share flow (recipient grid, search, selection, sending).
 * Owned by ShareSheetContext so ShareBottomSheet and ShareUserSearchSheet are true siblings —
 * neither is nested inside the other's BottomSheetModal, which avoids gorhom's known multi-modal
 * quirk where presenting one modal fires a spurious onChange(-1) on another.
 */
export const useShareSheetState = (payload: SharePayload | null) => {
  const userId = useAppSelector(s => s.auth.user?.id ?? null);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated && !s.auth.isGuest);

  const [selectedMap, setSelectedMap] = useState<Record<string, ShareRecipient>>({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const active = Boolean(payload) && isAuthenticated;

  const {
    followers,
    loading,
    error,
    query,
    setQuery,
    retry,
  } = useShareFollowers(userId, active);

  const { groups } = useShareGroups(active, userId);

  const selectedUsers = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const selectedCount = selectedUsers.length;

  // Flat, unified grid — groups and people mixed together with no section split, matching
  // Instagram's own share sheet (reference: a single grid, group threads shown alongside
  // individual people). Anyone selected from the dedicated search sheet who ISN'T already a
  // follower/group (i.e. found only via remote search) is pinned to the front so they actually
  // show up — with their checkmark — back in this grid, instead of just being tracked invisibly
  // in `selectedMap` with nowhere on screen to render them.
  const gridPeople = useMemo(() => {
    const base = [...groups, ...followers];
    const baseIds = new Set(base.map(p => p.id));
    const extraSelected = selectedUsers.filter(u => !baseIds.has(u.id));
    return [...extraSelected, ...base];
  }, [groups, followers, selectedUsers]);

  const isSearching = query.trim().length >= 3;
  const searchExcludeIds = useMemo(
    () => [...gridPeople.map(p => p.id), ...(userId ? [userId] : [])],
    [gridPeople, userId],
  );
  const {
    results: searchResults,
    loading: searching,
    error: searchError,
  } = useShareUserSearch(query, searchExcludeIds);

  const searchPeople = useMemo(
    () => (isSearching ? [...gridPeople, ...searchResults] : gridPeople),
    [gridPeople, isSearching, searchResults],
  );

  const toggleUser = useCallback((user: ShareRecipient) => {
    setSelectedMap(prev => {
      const next = { ...prev };
      if (next[user.id]) {
        delete next[user.id];
      } else {
        next[user.id] = user;
      }
      return next;
    });
  }, []);

  const resetForClose = useCallback(() => {
    setSelectedMap({});
    setMessage('');
    setQuery('');
  }, [setQuery]);

  const handleInternalSend = useCallback(
    async (mode: 'individual' | 'group') => {
      if (!payload || !selectedCount) {
        return undefined;
      }
      setSending(true);
      try {
        return await shareService.sendToRecipients(payload, selectedUsers, message, mode);
      } finally {
        setSending(false);
      }
    },
    [message, payload, selectedCount, selectedUsers],
  );

  const handlePlatform = useCallback(
    async (platform: SocialSharePlatform) => {
      if (!payload) {
        return;
      }
      if (platform === 'copy') {
        await copyShareLink(payload);
        return;
      }
      await shareViaPlatform(platform, payload);
    },
    [payload],
  );

  return {
    isAuthenticated,
    followers,
    groups,
    gridPeople,
    searchPeople,
    loading,
    error,
    retry,
    query,
    setQuery,
    isSearching,
    searching,
    searchError,
    selectedMap,
    selectedUsers,
    selectedCount,
    toggleUser,
    message,
    setMessage,
    sending,
    resetForClose,
    handleInternalSend,
    handlePlatform,
  };
};

export type ShareSheetState = ReturnType<typeof useShareSheetState>;
