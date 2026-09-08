import { bucketSavedItems, resolveGroupIdForItem } from '../src/presentation/hooks/bookmarkGrouping';
import {
  BookmarkGroup,
  BookmarkListingItem,
  UNCATEGORIZED_ID,
  categoryGroupId,
} from '../src/types/bookmark.types';

const makeItem = (overrides: Partial<BookmarkListingItem>): BookmarkListingItem => ({
  id: 'item_1',
  title: 'Listing',
  price: 100,
  currency: 'AED',
  location: 'Dubai',
  imageUrl: '',
  hasVideo: false,
  isSaved: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('resolveGroupIdForItem', () => {
  it('falls back to the item’s category when not assigned to a custom board', () => {
    const item = makeItem({ categoryId: 'cat_1', categoryName: 'Automotive' });
    expect(resolveGroupIdForItem(item, {}, new Set())).toBe(categoryGroupId('cat_1'));
  });

  it('falls back to Uncategorized when the item has no category', () => {
    const item = makeItem({});
    expect(resolveGroupIdForItem(item, {}, new Set())).toBe(UNCATEGORIZED_ID);
  });

  it('prefers an explicit custom-board assignment over the category', () => {
    const item = makeItem({ categoryId: 'cat_1', categoryName: 'Automotive' });
    const customGroupIds = new Set(['grp_custom']);
    expect(resolveGroupIdForItem(item, { item_1: 'grp_custom' }, customGroupIds)).toBe('grp_custom');
  });

  it('falls back to category when the assigned custom board no longer exists', () => {
    const item = makeItem({ categoryId: 'cat_1', categoryName: 'Automotive' });
    expect(resolveGroupIdForItem(item, { item_1: 'grp_deleted' }, new Set())).toBe(
      categoryGroupId('cat_1'),
    );
  });
});

describe('bucketSavedItems', () => {
  it('groups items by category automatically, one bucket per distinct category', () => {
    const items = [
      makeItem({ id: 'a', categoryId: 'cars', categoryName: 'Automotive' }),
      makeItem({ id: 'b', categoryId: 'cars', categoryName: 'Automotive' }),
      makeItem({ id: 'c', categoryId: 'kids', categoryName: 'Kids Stuff' }),
      makeItem({ id: 'd' }), // no category -> Uncategorized
    ];

    const buckets = bucketSavedItems(items, [], {});

    expect(buckets.size).toBe(3);
    expect(buckets.get(categoryGroupId('cars'))?.items.map(i => i.id).sort()).toEqual(['a', 'b']);
    expect(buckets.get(categoryGroupId('kids'))?.items.map(i => i.id)).toEqual(['c']);
    expect(buckets.get(UNCATEGORIZED_ID)?.items.map(i => i.id)).toEqual(['d']);
    expect(buckets.get(categoryGroupId('cars'))?.group.name).toBe('Automotive');
  });

  it('routes an item into its explicitly-assigned custom board instead of its category', () => {
    const customGroup: BookmarkGroup = {
      id: 'grp_1',
      name: 'Beautiful flowers',
      kind: 'custom',
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const items = [makeItem({ id: 'a', categoryId: 'plants', categoryName: 'Home & Garden' })];

    const buckets = bucketSavedItems(items, [customGroup], { a: 'grp_1' });

    expect(buckets.get('grp_1')?.items.map(i => i.id)).toEqual(['a']);
    expect(buckets.has(categoryGroupId('plants'))).toBe(false);
  });

  it('keeps an empty custom board visible even with zero items', () => {
    const customGroup: BookmarkGroup = {
      id: 'grp_empty',
      name: 'Wishlist',
      kind: 'custom',
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const buckets = bucketSavedItems([], [customGroup], {});
    expect(buckets.get('grp_empty')?.items).toEqual([]);
  });
});
