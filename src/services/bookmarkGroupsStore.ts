import { storage } from '../utils/storage';
import { BookmarkGroup } from '../types/bookmark.types';

const STORAGE_KEY_PREFIX = '@preelly/bookmark_groups_v2';

export interface BookmarkGroupsState {
  /** User-created ("custom") boards only — category boards are derived at read time in
   * `bookmarkGrouping.ts` and never persisted here. */
  groups: BookmarkGroup[];
  /** productId -> custom groupId. Absent entries (or an entry pointing at a deleted group) fall
   * back to that item's product-category board. */
  itemGroupMap: Record<string, string>;
}

const storageKey = (userId: string): string => `${STORAGE_KEY_PREFIX}:${userId}`;

const readState = async (userId: string): Promise<BookmarkGroupsState> => {
  const raw = await storage.getString(storageKey(userId));
  if (!raw) {
    return { groups: [], itemGroupMap: {} };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<BookmarkGroupsState>;
    return {
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      itemGroupMap:
        parsed.itemGroupMap && typeof parsed.itemGroupMap === 'object' ? parsed.itemGroupMap : {},
    };
  } catch {
    return { groups: [], itemGroupMap: {} };
  }
};

const writeState = async (userId: string, state: BookmarkGroupsState): Promise<void> => {
  await storage.setString(storageKey(userId), JSON.stringify(state));
};

const generateGroupId = (): string =>
  `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const bookmarkGroupsStore = {
  getState: readState,

  async createGroup(userId: string, name: string): Promise<BookmarkGroup> {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) {
      throw new Error('Group name is required');
    }
    const state = await readState(userId);
    if (state.groups.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('A group with this name already exists');
    }
    const now = new Date().toISOString();
    const group: BookmarkGroup = {
      id: generateGroupId(),
      name: trimmed,
      kind: 'custom',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    state.groups.push(group);
    await writeState(userId, state);
    return group;
  },

  async renameGroup(userId: string, groupId: string, name: string): Promise<BookmarkGroup> {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) {
      throw new Error('Group name is required');
    }
    const state = await readState(userId);
    const group = state.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    group.name = trimmed;
    group.updatedAt = new Date().toISOString();
    await writeState(userId, state);
    return group;
  },

  async setArchived(userId: string, groupId: string, isArchived: boolean): Promise<BookmarkGroup> {
    const state = await readState(userId);
    const group = state.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    group.isArchived = isArchived;
    group.updatedAt = new Date().toISOString();
    await writeState(userId, state);
    return group;
  },

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const state = await readState(userId);
    state.groups = state.groups.filter(g => g.id !== groupId);
    // Items assigned to the deleted board fall back to their product-category board the next
    // time buckets are computed — no further bookkeeping needed beyond clearing the assignment.
    Object.keys(state.itemGroupMap).forEach(productId => {
      if (state.itemGroupMap[productId] === groupId) {
        delete state.itemGroupMap[productId];
      }
    });
    await writeState(userId, state);
  },

  /** Assigns an item to a custom board. */
  async assignItemToGroup(userId: string, productId: string, groupId: string): Promise<void> {
    const state = await readState(userId);
    state.itemGroupMap[productId] = groupId;
    await writeState(userId, state);
  },

  /** Clears any custom-board assignment — the item falls back to its product-category board. */
  async removeItem(userId: string, productId: string): Promise<void> {
    const state = await readState(userId);
    if (productId in state.itemGroupMap) {
      delete state.itemGroupMap[productId];
      await writeState(userId, state);
    }
  },
};
