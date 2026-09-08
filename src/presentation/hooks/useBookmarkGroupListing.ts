import { useCallback, useMemo, useState } from 'react';
import { bookmarkGroupsStore } from '../../services/bookmarkGroupsStore';
import { BookmarkListingItem } from '../../types/bookmark.types';
import { saveProduct } from '../redux/slices/productSlice';
import { bucketSavedItems } from './bookmarkGrouping';
import { useBookmarkSavedData } from './useBookmarkSavedData';
import { useAppDispatch } from './useRedux';
import { useDebouncedValue } from './useDebouncedValue';

export const useBookmarkGroupListing = (groupId: string) => {
  const data = useBookmarkSavedData();
  const dispatch = useAppDispatch();
  const [searchInput, setSearchInput] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput.trim().toLowerCase(), 350);

  const buckets = useMemo(
    () => bucketSavedItems(data.items, data.groups, data.itemGroupMap),
    [data.groups, data.itemGroupMap, data.items],
  );

  const bucket = buckets.get(groupId);
  const group = bucket?.group ?? null;

  const groupItems = useMemo(
    () =>
      (bucket?.items ?? [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bucket],
  );

  const visibleItems = useMemo(() => {
    if (!debouncedSearch) {
      return groupItems;
    }
    return groupItems.filter(item => item.title.toLowerCase().includes(debouncedSearch));
  }, [debouncedSearch, groupItems]);

  const isCustomGroup = group?.kind === 'custom';

  /** Other custom boards an item here can be moved into — a category board can't be a move
   * target directly (moving "out" of a category board just means unassigning, see
   * `moveItemToGroup(productId, null)`). */
  const otherGroups = useMemo(
    () => data.groups.filter(g => g.id !== groupId && !g.isArchived),
    [data.groups, groupId],
  );

  const unsaveItem = useCallback(
    async (item: BookmarkListingItem) => {
      setBusyItemId(item.id);
      data.removeItemLocally(item.id);
      try {
        await dispatch(saveProduct(item.id)).unwrap();
        await bookmarkGroupsStore.removeItem(data.userId, item.id);
      } catch {
        // Roll back the optimistic removal — the Redux slice already reverts its own copy of
        // this product's `isSaved` flag on the same rejection.
        data.restoreItemLocally(item);
        throw new Error('Failed to remove from saved items. Please try again.');
      } finally {
        setBusyItemId(null);
      }
    },
    [data, dispatch],
  );

  /** Pass `null` to unassign the item back to its automatic product-category board. */
  const moveItemToGroup = useCallback(
    async (productId: string, targetGroupId: string | null) => {
      if (targetGroupId) {
        await bookmarkGroupsStore.assignItemToGroup(data.userId, productId, targetGroupId);
      } else {
        await bookmarkGroupsStore.removeItem(data.userId, productId);
      }
      await data.reloadGroupsOnly();
    },
    [data],
  );

  return {
    group,
    isCustomGroup,
    items: visibleItems,
    totalCount: groupItems.length,
    otherGroups,
    loading: data.loading,
    refreshing: data.refreshing,
    error: data.error,
    refresh: data.refresh,
    searchInput,
    setSearchInput,
    busyItemId,
    unsaveItem,
    moveItemToGroup,
  };
};
