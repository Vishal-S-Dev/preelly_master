/**
 * The backend has no boards/collections concept today — `GET /api/user/saved` returns a flat
 * list of saved products (each with its own `category`), no group field. Boards are therefore
 * computed on the client in two layers:
 *  - "custom" boards: user-created, persisted in `bookmarkGroupsStore.ts` (AsyncStorage), and an
 *    item can be explicitly assigned to one.
 *  - "category" boards: derived automatically, one per distinct product category found among the
 *    user's saved items — this is the default grouping for any item not explicitly assigned to a
 *    custom board (see `bookmarkGrouping.ts`).
 */
export type BookmarkGroupKind = 'category' | 'custom';

export const UNCATEGORIZED_ID = 'category:uncategorized';
export const UNCATEGORIZED_NAME = 'Uncategorized';

export const categoryGroupId = (categoryId: string): string => `category:${categoryId}`;

export interface BookmarkGroup {
  id: string;
  name: string;
  kind: BookmarkGroupKind;
  /** Category emoji/icon path, category boards only. */
  icon?: string;
  /** Only custom boards can be archived/renamed/deleted — category boards are derived and always
   * active. */
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkListingItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  imageUrl: string;
  hasVideo: boolean;
  videoUrl?: string;
  isSaved: boolean;
  isFeatured?: boolean;
  isSold?: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
}

export type BookmarkSortOption =
  | 'recently_saved'
  | 'recently_updated'
  | 'alphabetical'
  | 'most_items';

export const BOOKMARK_SORT_OPTIONS: { id: BookmarkSortOption; label: string }[] = [
  { id: 'recently_saved', label: 'Recently Saved' },
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'alphabetical', label: 'Alphabetical' },
  { id: 'most_items', label: 'Most Items' },
];

export type BookmarkArchiveFilter = 'active' | 'archived' | 'all';

export const BOOKMARK_ARCHIVE_OPTIONS: { id: BookmarkArchiveFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

/** 'all' shows every (filtered) board; a specific id narrows the grid down to one board. */
export type BookmarkGroupFilter = 'all' | string;

export interface BookmarkGroupSummary {
  group: BookmarkGroup;
  itemCount: number;
  /** Up to 4 items, most-recently-saved first — just enough to render the collage preview. */
  previewItems: BookmarkListingItem[];
  /** Most recent activity in this board: latest item timestamp, or the board's own updatedAt. */
  lastActivityAt: string;
}
