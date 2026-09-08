import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  AlertButton,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BookmarkCollageCard } from '../../components/bookmark/BookmarkCollageCard';
import { BookmarkBoardSkeleton } from '../../components/bookmark/BookmarkBoardSkeleton';
import { GroupFormSheet } from '../../components/bookmark/GroupFormSheet';
import { FilterChip } from '../../components/search/FilterChip';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useBookmarkGroups } from '../../hooks/useBookmarkGroups';
import { useReelPlaybackGate } from '../../hooks/useReelPlaybackGate';
import { RootStackParamList } from '../../navigation/types';
import {
  BOOKMARK_ARCHIVE_OPTIONS,
  BOOKMARK_SORT_OPTIONS,
  BookmarkGroup,
  BookmarkGroupSummary,
} from '../../../types/bookmark.types';

const GRID_PADDING = 16;
const GRID_GAP = 14;
const MAX_CONCURRENT_BOARD_PREVIEWS = 4;
const BOARD_VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 30, minimumViewTime: 200 };

export const BookmarkScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(() => (width - GRID_PADDING * 2 - GRID_GAP) / 2, [width]);

  const bookmarks = useBookmarkGroups();
  const isPlaybackAllowed = useReelPlaybackGate();
  const [visibleGroupIds, setVisibleGroupIds] = useState<ReadonlySet<string>>(() => new Set());
  const [formSheet, setFormSheet] = useState<
    { mode: 'create' } | { mode: 'rename'; group: BookmarkGroup } | null
  >(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems
        .filter(v => v.isViewable)
        .map(v => (v.item as BookmarkGroupSummary).group.id)
        .slice(0, MAX_CONCURRENT_BOARD_PREVIEWS);
      setVisibleGroupIds(new Set(ids));
    },
    [],
  );
  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: BOARD_VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
  );

  const openGroup = useCallback(
    (group: BookmarkGroup) => {
      navigation.navigate('BookmarkGroupListing', { groupId: group.id, groupName: group.name });
    },
    [navigation],
  );

  const handleSortPress = useCallback(() => {
    const buttons: AlertButton[] = BOOKMARK_SORT_OPTIONS.map(opt => ({
      text: opt.id === bookmarks.sort ? `✓ ${opt.label}` : opt.label,
      onPress: () => bookmarks.setSort(opt.id),
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Sort boards', undefined, buttons);
  }, [bookmarks]);

  const handleGroupFilterPress = useCallback(() => {
    // Boards currently on screen — a mix of user-created ("custom") boards and the automatic
    // per-category boards derived from each saved item's product category.
    const options = [{ id: 'all', label: 'All Groups' }, ...bookmarks.groupOptions];
    const buttons: AlertButton[] = options.map(opt => ({
      text: opt.id === bookmarks.groupFilter ? `✓ ${opt.label}` : opt.label,
      onPress: () => bookmarks.setGroupFilter(opt.id),
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Filter by group', undefined, buttons);
  }, [bookmarks]);

  const handleArchivedPress = useCallback(() => {
    const buttons: AlertButton[] = BOOKMARK_ARCHIVE_OPTIONS.map(opt => ({
      text: opt.id === bookmarks.archiveFilter ? `✓ ${opt.label}` : opt.label,
      onPress: () => bookmarks.setArchiveFilter(opt.id),
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Archived boards', undefined, buttons);
  }, [bookmarks]);

  const handleGroupLongPress = useCallback(
    (group: BookmarkGroup) => {
      // Category boards are derived automatically from each item's product category — they
      // aren't stored/editable, only user-created ("custom") boards get the rename/archive/delete
      // menu.
      if (group.kind !== 'custom') {
        return;
      }
      const summary = bookmarks.summaries.find(s => s.group.id === group.id);
      const itemCount = summary?.itemCount ?? 0;

      Alert.alert(group.name, undefined, [
        { text: 'Rename Board', onPress: () => setFormSheet({ mode: 'rename', group }) },
        {
          text: group.isArchived ? 'Unarchive Board' : 'Archive Board',
          onPress: () =>
            bookmarks
              .setGroupArchived(group.id, !group.isArchived)
              .catch(err => Alert.alert('Unable to update board', err instanceof Error ? err.message : 'Please try again')),
        },
        {
          text: 'Delete Board',
          style: 'destructive',
          onPress: () => {
            if (itemCount > 0) {
              Alert.alert(
                'Board not empty',
                'Move or remove all items from this board before deleting it.',
              );
              return;
            }
            Alert.alert('Delete this board?', `"${group.name}" will be permanently deleted.`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  bookmarks
                    .deleteGroup(group.id)
                    .catch(err =>
                      Alert.alert('Unable to delete board', err instanceof Error ? err.message : 'Please try again'),
                    ),
              },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [bookmarks],
  );

  const handleCreateGroup = useCallback(
    async (name: string) => {
      await bookmarks.createGroup(name);
    },
    [bookmarks],
  );

  const handleRenameGroup = useCallback(
    async (name: string) => {
      if (formSheet?.mode === 'rename') {
        await bookmarks.renameGroup(formSheet.group.id, name);
      }
    },
    [bookmarks, formSheet],
  );

  const handleOpenSearch = useCallback(() => {
    navigation.navigate('Search', {});
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: BookmarkGroupSummary }) => (
      <BookmarkCollageCard
        summary={item}
        cardWidth={cardWidth}
        onPress={openGroup}
        // Category boards are derived, not stored — only user-created boards get the long-press
        // rename/archive/delete menu.
        onLongPress={item.group.kind === 'custom' ? handleGroupLongPress : undefined}
        isVisible={isPlaybackAllowed && visibleGroupIds.has(item.group.id)}
      />
    ),
    [cardWidth, handleGroupLongPress, isPlaybackAllowed, openGroup, visibleGroupIds],
  );

  const keyExtractor = useCallback((item: BookmarkGroupSummary) => item.group.id, []);

  const isInitialLoading = bookmarks.loading && bookmarks.summaries.length === 0 && !bookmarks.error;

  const listEmpty = useMemo(() => {
    if (isInitialLoading) {
      return null;
    }
    if (bookmarks.error) {
      return (
        <View style={styles.emptyWrap}>
          <Icon name="wifi-off" size={48} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Couldn’t load your boards</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>{bookmarks.error}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={bookmarks.refresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading saved items"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (bookmarks.isSearching) {
      return (
        <View style={styles.emptyWrap}>
          <Icon name="magnify" size={48} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No matching boards</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Try a different search term.
          </Text>
        </View>
      );
    }
    if (!bookmarks.hasAnyItems && bookmarks.totalGroupCount === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Icon name="bookmark-outline" size={48} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved items yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Items you save while browsing will show up here — organized into boards.
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={handleOpenSearch}
            accessibilityRole="button"
            accessibilityLabel="Browse listings"
          >
            <Text style={styles.retryText}>Browse Listings</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Icon name="archive-outline" size={48} color={theme.subText} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No boards to show</Text>
        <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
          Try changing the Group or Archived filter.
        </Text>
      </View>
    );
  }, [
    bookmarks.error,
    bookmarks.hasAnyItems,
    bookmarks.isSearching,
    bookmarks.refresh,
    bookmarks.totalGroupCount,
    handleOpenSearch,
    isInitialLoading,
    theme.primary,
    theme.subText,
    theme.text,
  ]);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <BookmarkBoardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={[styles.searchBar, { borderColor: theme.subText + '44', backgroundColor: theme.background }]}>
          <Icon name="magnify" size={20} color={theme.subText} />
          <TextInput
            value={bookmarks.searchInput}
            onChangeText={bookmarks.setSearchInput}
            placeholder="Search your saved ideas"
            placeholderTextColor={theme.subText}
            style={[styles.searchInput, { color: theme.text }]}
            accessibilityLabel="Search saved items"
            accessibilityHint="Searches board names and saved item titles"
            returnKeyType="search"
          />
        </View>
        {/* <Pressable
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setFormSheet({ mode: 'create' })}
          accessibilityRole="button"
          accessibilityLabel="Create new bookmark group"
        >
          <Icon name="plus" size={22} color="#FFFFFF" />
        </Pressable> */}
      </View>

      <View style={styles.chipRow}>
        <FilterChip
          label="Sort"
          icon="swap-vertical"
          variant="outline"
          onPress={handleSortPress}
          accessibilityHint="Sort saved boards"
        />
        <FilterChip
          label="Group"
          icon="folder-outline"
          variant="outline"
          selected={bookmarks.groupFilter !== 'all'}
          onPress={handleGroupFilterPress}
          accessibilityHint="Filter boards by group"
        />
        {/* <FilterChip
          label="Archived"
          icon="archive-outline"
          variant="outline"
          selected={bookmarks.archiveFilter !== 'active'}
          onPress={handleArchivedPress}
          accessibilityHint="Filter boards by archive status"
        /> */}
      </View>

      <FlatList
        data={bookmarks.summaries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={bookmarks.summaries.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl refreshing={bookmarks.refreshing} onRefresh={bookmarks.refresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      />

      <GroupFormSheet
        visible={formSheet !== null}
        mode={formSheet?.mode ?? 'create'}
        initialName={formSheet?.mode === 'rename' ? formSheet.group.name : undefined}
        onSubmit={formSheet?.mode === 'rename' ? handleRenameGroup : handleCreateGroup}
        onClose={() => setFormSheet(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    height: '100%',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 16,
    gap: 8,
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 32,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
