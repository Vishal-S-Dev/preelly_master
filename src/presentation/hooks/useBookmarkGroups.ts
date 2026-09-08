import { useCallback, useMemo, useState } from 'react';
import { bookmarkGroupsStore } from '../../services/bookmarkGroupsStore';
import {
  BookmarkArchiveFilter,
  BookmarkGroupFilter,
  BookmarkGroupSummary,
  BookmarkSortOption,
} from '../../types/bookmark.types';
import { bucketSavedItems } from './bookmarkGrouping';
import { useBookmarkSavedData } from './useBookmarkSavedData';
import { useDebouncedValue } from './useDebouncedValue';

const PREVIEW_COUNT = 4;

export const useBookmarkGroups = () => {
  const data = useBookmarkSavedData();
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<BookmarkSortOption>('recently_saved');
  const [groupFilter, setGroupFilter] = useState<BookmarkGroupFilter>('all');
  const [archiveFilter, setArchiveFilter] = useState<BookmarkArchiveFilter>('active');
  const debouncedSearch = useDebouncedValue(searchInput.trim().toLowerCase(), 350);

  const buckets = useMemo(
    () => bucketSavedItems(data.items, data.groups, data.itemGroupMap),
    [data.groups, data.itemGroupMap, data.items],
  );

  const allSummaries = useMemo<BookmarkGroupSummary[]>(
    () =>
      Array.from(buckets.values()).map(({ group, items }) => {
        const sortedItems = items
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
          group,
          itemCount: sortedItems.length,
          previewItems: sortedItems.slice(0, PREVIEW_COUNT),
          lastActivityAt: sortedItems[0]?.createdAt ?? group.updatedAt,
        };
      }),
    [buckets],
  );

  const filteredSummaries = useMemo(() => {
    let list = allSummaries;

    if (archiveFilter === 'active') {
      list = list.filter(summary => !summary.group.isArchived);
    } else if (archiveFilter === 'archived') {
      list = list.filter(summary => summary.group.isArchived);
    }

    if (groupFilter !== 'all') {
      list = list.filter(summary => summary.group.id === groupFilter);
    }

    if (debouncedSearch) {
      list = list.filter(summary => {
        if (summary.group.name.toLowerCase().includes(debouncedSearch)) {
          return true;
        }
        const bucket = buckets.get(summary.group.id);
        return Boolean(
          bucket?.items.some(item => item.title.toLowerCase().includes(debouncedSearch)),
        );
      });
    }

    const sorted = list.slice();
    switch (sort) {
      case 'alphabetical':
        sorted.sort((a, b) => a.group.name.localeCompare(b.group.name));
        break;
      case 'most_items':
        sorted.sort((a, b) => b.itemCount - a.itemCount);
        break;
      case 'recently_updated':
        sorted.sort(
          (a, b) => new Date(b.group.updatedAt).getTime() - new Date(a.group.updatedAt).getTime(),
        );
        break;
      case 'recently_saved':
      default:
        sorted.sort(
          (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
        );
        break;
    }
    return sorted;
  }, [allSummaries, archiveFilter, buckets, debouncedSearch, groupFilter, sort]);

  const createGroup = useCallback(
    async (name: string) => {
      await bookmarkGroupsStore.createGroup(data.userId, name);
      await data.reloadGroupsOnly();
    },
    [data],
  );

  const renameGroup = useCallback(
    async (groupId: string, name: string) => {
      await bookmarkGroupsStore.renameGroup(data.userId, groupId, name);
      await data.reloadGroupsOnly();
    },
    [data],
  );

  const setGroupArchived = useCallback(
    async (groupId: string, isArchived: boolean) => {
      await bookmarkGroupsStore.setArchived(data.userId, groupId, isArchived);
      await data.reloadGroupsOnly();
    },
    [data],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await bookmarkGroupsStore.deleteGroup(data.userId, groupId);
      await data.reloadGroupsOnly();
    },
    [data],
  );

  return {
    summaries: filteredSummaries,
    totalGroupCount: allSummaries.length,
    hasAnyItems: data.items.length > 0,
    /** Every board currently on screen, custom and category alike — used to populate the "Group"
     * filter menu. */
    groupOptions: allSummaries.map(s => ({ id: s.group.id, label: s.group.name })),
    customGroups: data.groups,
    loading: data.loading,
    refreshing: data.refreshing,
    error: data.error,
    refresh: data.refresh,
    searchInput,
    setSearchInput,
    isSearching: Boolean(debouncedSearch),
    sort,
    setSort,
    groupFilter,
    setGroupFilter,
    archiveFilter,
    setArchiveFilter,
    createGroup,
    renameGroup,
    setGroupArchived,
    deleteGroup,
  };
};
