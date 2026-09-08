import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BookmarkListingItem } from '../../../types/bookmark.types';
import { SearchResultCard } from '../search/SearchResultCard';
import { SearchListingItem } from '../../../types/search.types';

interface Props {
  item: BookmarkListingItem;
  isVisible?: boolean;
  busy?: boolean;
  onPress: (item: BookmarkListingItem) => void;
  onToggleSave: (item: BookmarkListingItem) => void;
  onMore: (item: BookmarkListingItem) => void;
}

/**
 * Thin wrapper around the existing `SearchResultCard` (untouched, so its behavior on
 * SearchResultScreen never changes) that overlays a bookmark-toggle heart and a "more actions"
 * button — the affordances a saved-items list needs but the shared card doesn't render.
 */
export const BookmarkResultCard = memo<Props>(
  ({ item, isVisible = false, busy = false, onPress, onToggleSave, onMore }) => {
    const handlePress = () => onPress(item);

    return (
      <View style={styles.wrapper}>
        <SearchResultCard
          item={item as SearchListingItem}
          onPress={handlePress}
          isVisible={isVisible}
        />

        <Pressable
          style={styles.heartBtn}
          onPress={() => onToggleSave(item)}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remove from saved items"
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="heart" size={16} color="#FF4D67" />
          )}
        </Pressable>

        <Pressable
          style={styles.moreBtn}
          onPress={() => onMore(item)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`More actions for ${item.title}`}
        >
          <Icon name="dots-horizontal" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  },
);

BookmarkResultCard.displayName = 'BookmarkResultCard';

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    position: 'absolute',
    top: 10,
    right: 46,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
