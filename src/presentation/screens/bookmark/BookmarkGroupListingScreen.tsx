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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BookmarkResultCard } from '../../components/bookmark/BookmarkResultCard';
import { SearchFilterSkeleton } from '../../components/search/SearchFilterSkeleton';
import {
  SEARCH_RESULT_GRID_GAP,
  SEARCH_RESULT_GRID_PADDING,
} from '../../components/search/SearchResultCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useBookmarkGroupListing } from '../../hooks/useBookmarkGroupListing';
import { useReelPlaybackGate } from '../../hooks/useReelPlaybackGate';
import { RootStackParamList } from '../../navigation/types';
import { BookmarkListingItem } from '../../../types/bookmark.types';
import { formatPinCountLabel } from '../../../utils/relativeTime';

const MAX_CONCURRENT_VIDEO_PREVIEWS = 4;
const VIDEO_PREVIEW_VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 30, minimumViewTime: 200 };

export const BookmarkGroupListingScreen: React.FC = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BookmarkGroupListing'>>();
  const { groupId, groupName } = route.params;

  const listing = useBookmarkGroupListing(groupId);
  const isPlaybackAllowed = useReelPlaybackGate();
  const [searchVisible, setSearchVisible] = useState(false);
  const [visibleVideoIds, setVisibleVideoIds] = useState<ReadonlySet<string>>(() => new Set());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems
        .filter(v => v.isViewable && (v.item as BookmarkListingItem | undefined)?.hasVideo)
        .map(v => (v.item as BookmarkListingItem).id)
        .slice(0, MAX_CONCURRENT_VIDEO_PREVIEWS);
      setVisibleVideoIds(new Set(ids));
    },
    [],
  );
  const viewabilityConfigCallbackPairs = useMemo(
    () => [{ viewabilityConfig: VIDEO_PREVIEW_VIEWABILITY_CONFIG, onViewableItemsChanged }],
    [onViewableItemsChanged],
  );

  const handleOpenProduct = useCallback(
    (item: BookmarkListingItem) => {
      navigation.navigate('ProductDetail', { productId: item.id });
    },
    [navigation],
  );

  const handleToggleSave = useCallback(
    (item: BookmarkListingItem) => {
      listing.unsaveItem(item).catch(err => {
        Alert.alert('Unable to remove', err instanceof Error ? err.message : 'Please try again');
      });
    },
    [listing],
  );

  const handleMove = useCallback(
    (item: BookmarkListingItem, targetGroupId: string | null) => {
      listing
        .moveItemToGroup(item.id, targetGroupId)
        .catch(err => Alert.alert('Unable to move item', err instanceof Error ? err.message : 'Please try again'));
    },
    [listing],
  );

  const handleMore = useCallback(
    (item: BookmarkListingItem) => {
      const moveButtons: AlertButton[] = listing.otherGroups.map(group => ({
        text: group.name,
        onPress: () => handleMove(item, group.id),
      }));

      // Only offer "move back to category" for items sitting in a custom board — an item already
      // on its category board has nowhere else automatic to go.
      if (listing.isCustomGroup && item.categoryName) {
        moveButtons.push({
          text: `Move back to ${item.categoryName}`,
          onPress: () => handleMove(item, null),
        });
      }

      Alert.alert(item.title, 'Move to another board, or remove from saved items.', [
        ...moveButtons,
        { text: 'Remove from Saved', style: 'destructive', onPress: () => handleToggleSave(item) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [handleMove, handleToggleSave, listing.isCustomGroup, listing.otherGroups],
  );

  const renderItem = useCallback(
    ({ item }: { item: BookmarkListingItem }) => (
      <BookmarkResultCard
        item={item}
        isVisible={isPlaybackAllowed && visibleVideoIds.has(item.id)}
        busy={listing.busyItemId === item.id}
        onPress={handleOpenProduct}
        onToggleSave={handleToggleSave}
        onMore={handleMore}
      />
    ),
    [handleMore, handleOpenProduct, handleToggleSave, isPlaybackAllowed, listing.busyItemId, visibleVideoIds],
  );

  const keyExtractor = useCallback((item: BookmarkListingItem) => item.id, []);

  const isInitialLoading = listing.loading && listing.items.length === 0 && !listing.error;

  const listEmpty = useMemo(() => {
    if (isInitialLoading) {
      return null;
    }
    if (listing.error) {
      return (
        <View style={styles.emptyWrap}>
          <Icon name="wifi-off" size={44} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Couldn’t load this board</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>{listing.error}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={listing.refresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading board items"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (listing.searchInput.trim()) {
      return (
        <View style={styles.emptyWrap}>
          <Icon name="magnify" size={44} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No matching items</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Try a different search term.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Icon name="image-multiple-outline" size={44} color={theme.subText} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No items in this board</Text>
        <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
          Save items to this board and they’ll show up here.
        </Text>
      </View>
    );
  }, [isInitialLoading, listing.error, listing.refresh, listing.searchInput, theme.primary, theme.subText, theme.text]);

  const displayName = listing.group?.name ?? groupName ?? 'Board';

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <SearchFilterSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
            {formatPinCountLabel(listing.totalCount)}
          </Text>
        </View>

        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={() => setSearchVisible(prev => !prev)}
          accessibilityRole="button"
          accessibilityLabel="Search within this board"
          accessibilityState={{ selected: searchVisible }}
        >
          <Icon name={searchVisible ? 'close' : 'magnify'} size={22} color={theme.text} />
        </Pressable>
      </View>

      {searchVisible ? (
        <View style={[styles.searchRow, { borderColor: theme.subText + '33' }]}>
          <Icon name="magnify" size={18} color={theme.subText} />
          <TextInput
            value={listing.searchInput}
            onChangeText={listing.setSearchInput}
            placeholder={`Search in ${displayName}`}
            placeholderTextColor={theme.subText}
            style={[styles.searchInput, { color: theme.text }]}
            accessibilityLabel="Search items in this board"
            autoFocus
          />
        </View>
      ) : null}

      <FlatList
        data={listing.items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={listing.items.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl refreshing={listing.refreshing} onRefresh={listing.refresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    height: '100%',
  },
  gridContent: {
    paddingHorizontal: SEARCH_RESULT_GRID_PADDING,
    paddingBottom: 24,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: SEARCH_RESULT_GRID_GAP,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
