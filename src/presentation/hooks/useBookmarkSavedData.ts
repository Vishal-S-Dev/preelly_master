import { useCallback, useEffect, useRef, useState } from 'react';
import { bookmarkService, getBookmarkErrorMessage } from '../../services/bookmark.service';
import { bookmarkGroupsStore } from '../../services/bookmarkGroupsStore';
import { BookmarkGroup, BookmarkListingItem } from '../../types/bookmark.types';
import { useAppSelector } from './useRedux';

interface State {
  items: BookmarkListingItem[];
  groups: BookmarkGroup[];
  itemGroupMap: Record<string, string>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/**
 * Shared saved-items + local-groups fetch used by both the Bookmark boards screen and a single
 * board's listing screen. Kept as a plain hook (useState/useCallback), matching the rest of this
 * feature area (useMyArchives, useProfileData) rather than introducing React Query here.
 */
export const useBookmarkSavedData = () => {
  const userId = useAppSelector(state => state.auth.user?.id) ?? 'guest';
  const [state, setState] = useState<State>({
    items: [],
    groups: [],
    itemGroupMap: {},
    loading: true,
    refreshing: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      setState(prev => ({
        ...prev,
        loading: mode === 'initial' ? true : prev.loading,
        refreshing: mode === 'refresh',
        error: null,
      }));

      try {
        const [items, groupsState] = await Promise.all([
          bookmarkService.fetchAllSavedListings(),
          bookmarkGroupsStore.getState(userId),
        ]);
        if (!mountedRef.current) {
          return;
        }
        setState({
          items,
          groups: groupsState.groups,
          itemGroupMap: groupsState.itemGroupMap,
          loading: false,
          refreshing: false,
          error: null,
        });
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }
        setState(prev => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: getBookmarkErrorMessage(err),
        }));
      }
    },
    [userId],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('silent'), [load]);

  const reloadGroupsOnly = useCallback(async () => {
    const groupsState = await bookmarkGroupsStore.getState(userId);
    if (!mountedRef.current) {
      return;
    }
    setState(prev => ({
      ...prev,
      groups: groupsState.groups,
      itemGroupMap: groupsState.itemGroupMap,
    }));
  }, [userId]);

  const removeItemLocally = useCallback((productId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== productId),
    }));
  }, []);

  const restoreItemLocally = useCallback((item: BookmarkListingItem) => {
    setState(prev =>
      prev.items.some(existing => existing.id === item.id)
        ? prev
        : { ...prev, items: [item, ...prev.items] },
    );
  }, []);

  return {
    userId,
    items: state.items,
    groups: state.groups,
    itemGroupMap: state.itemGroupMap,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    refresh,
    reload,
    reloadGroupsOnly,
    removeItemLocally,
    restoreItemLocally,
  };
};
