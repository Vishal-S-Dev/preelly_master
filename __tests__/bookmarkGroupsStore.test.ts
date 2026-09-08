jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

import { bookmarkGroupsStore } from '../src/services/bookmarkGroupsStore';

// Each test uses its own user id so the AsyncStorage-backed store starts empty and tests never
// leak state into one another regardless of execution order.
let testCounter = 0;
const nextUserId = () => `user_${(testCounter += 1)}`;

describe('bookmarkGroupsStore', () => {
  it('starts with no custom boards and no assignments', async () => {
    const state = await bookmarkGroupsStore.getState(nextUserId());
    expect(state.groups).toEqual([]);
    expect(state.itemGroupMap).toEqual({});
  });

  it('creates a custom group and rejects duplicate names', async () => {
    const userId = nextUserId();
    const group = await bookmarkGroupsStore.createGroup(userId, 'Beautiful flowers');
    expect(group.name).toBe('Beautiful flowers');
    expect(group.kind).toBe('custom');
    expect(group.isArchived).toBe(false);

    await expect(bookmarkGroupsStore.createGroup(userId, 'Beautiful flowers')).rejects.toThrow();
    await expect(bookmarkGroupsStore.createGroup(userId, '   ')).rejects.toThrow();
  });

  it('assigns and clears an item assignment', async () => {
    const userId = nextUserId();
    const group = await bookmarkGroupsStore.createGroup(userId, 'Cars');
    await bookmarkGroupsStore.assignItemToGroup(userId, 'item_1', group.id);

    let state = await bookmarkGroupsStore.getState(userId);
    expect(state.itemGroupMap.item_1).toBe(group.id);

    // Clearing the assignment lets the item fall back to its product-category board.
    await bookmarkGroupsStore.removeItem(userId, 'item_1');
    state = await bookmarkGroupsStore.getState(userId);
    expect(state.itemGroupMap.item_1).toBeUndefined();
  });

  it('rename, archive and delete a group; deleting clears its item assignments', async () => {
    const userId = nextUserId();
    const group = await bookmarkGroupsStore.createGroup(userId, 'Temp board');
    await bookmarkGroupsStore.assignItemToGroup(userId, 'item_2', group.id);

    const renamed = await bookmarkGroupsStore.renameGroup(userId, group.id, 'Renamed board');
    expect(renamed.name).toBe('Renamed board');

    const archived = await bookmarkGroupsStore.setArchived(userId, group.id, true);
    expect(archived.isArchived).toBe(true);

    await bookmarkGroupsStore.deleteGroup(userId, group.id);
    const state = await bookmarkGroupsStore.getState(userId);
    expect(state.groups.find(g => g.id === group.id)).toBeUndefined();
    expect(state.itemGroupMap.item_2).toBeUndefined();
  });

  it('rejects operating on a group that does not exist', async () => {
    const userId = nextUserId();
    await expect(bookmarkGroupsStore.renameGroup(userId, 'missing', 'New name')).rejects.toThrow();
    await expect(bookmarkGroupsStore.setArchived(userId, 'missing', true)).rejects.toThrow();
  });
});
