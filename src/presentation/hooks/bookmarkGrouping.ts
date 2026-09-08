import {
  BookmarkGroup,
  BookmarkListingItem,
  UNCATEGORIZED_ID,
  UNCATEGORIZED_NAME,
  categoryGroupId,
} from '../../types/bookmark.types';

/** A saved item falls back to its product category board unless it's been explicitly assigned to
 * a still-existing custom board. */
export const resolveGroupIdForItem = (
  item: BookmarkListingItem,
  itemGroupMap: Record<string, string>,
  customGroupIds: ReadonlySet<string>,
): string => {
  const assigned = itemGroupMap[item.id];
  if (assigned && customGroupIds.has(assigned)) {
    return assigned;
  }
  return item.categoryId ? categoryGroupId(item.categoryId) : UNCATEGORIZED_ID;
};

const buildCategoryGroup = (item: BookmarkListingItem): BookmarkGroup => {
  const id = item.categoryId ? categoryGroupId(item.categoryId) : UNCATEGORIZED_ID;
  const timestamp = item.createdAt;
  return {
    id,
    name: item.categoryName?.trim() || UNCATEGORIZED_NAME,
    kind: 'category',
    icon: item.categoryIcon,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export interface BookmarkGroupBucket {
  group: BookmarkGroup;
  items: BookmarkListingItem[];
}

/**
 * Buckets every saved item into a board: a custom board when explicitly assigned (and that board
 * still exists), otherwise the item's own product-category board — derived on the fly, one per
 * distinct category actually present among the saved items (no empty category boards). Custom
 * boards are always included even when empty, since the user created them on purpose.
 */
export const bucketSavedItems = (
  items: BookmarkListingItem[],
  customGroups: BookmarkGroup[],
  itemGroupMap: Record<string, string>,
): Map<string, BookmarkGroupBucket> => {
  const buckets = new Map<string, BookmarkGroupBucket>();
  const customGroupIds = new Set(customGroups.map(g => g.id));
  customGroups.forEach(group => buckets.set(group.id, { group, items: [] }));

  items.forEach(item => {
    const groupId = resolveGroupIdForItem(item, itemGroupMap, customGroupIds);
    let bucket = buckets.get(groupId);
    if (!bucket) {
      bucket = { group: buildCategoryGroup(item), items: [] };
      buckets.set(groupId, bucket);
    }
    bucket.items.push(item);
  });

  return buckets;
};
