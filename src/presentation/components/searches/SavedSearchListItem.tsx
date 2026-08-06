import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedSearchListing } from '../../../types/savedSearch.types';
import { savedSearchesStyles, SAVED_SEARCH_COLORS } from '../../screens/searches/savedSearchesStyles';

interface Props {
  item: SavedSearchListing;
  busy?: boolean;
  onOpen: () => void;
  onToggleNotify: () => void;
  onOpenMore: () => void;
}

const PreviewStack: React.FC<{ images: string[] }> = ({ images }) => {
  if (!images.length) {
    return null;
  }
  return (
    <View style={savedSearchesStyles.previewStack}>
      {images.map((uri, index) => (
        <Image
          key={`${uri}_${index}`}
          source={{ uri }}
          style={[
            savedSearchesStyles.previewThumb,
            { right: index * 16, zIndex: images.length - index },
          ]}
        />
      ))}
    </View>
  );
};

export const SavedSearchListItem = memo<Props>(
  ({ item, busy, onOpen, onToggleNotify, onOpenMore }) => (
    <Pressable style={savedSearchesStyles.card} onPress={onOpen} disabled={busy}>
      <View style={savedSearchesStyles.cardTopRow}>
        <Text style={savedSearchesStyles.breadcrumb} numberOfLines={1}>
          {item.breadcrumb || 'Saved search'}
        </Text>

        {busy ? (
          <ActivityIndicator size="small" color={SAVED_SEARCH_COLORS.primary} />
        ) : (
          <View style={savedSearchesStyles.cardIconsRow}>
            <Pressable
              onPress={onToggleNotify}
              style={savedSearchesStyles.iconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={item.notifyEnabled ? 'Notifications on' : 'Notifications off'}>
              <Icon
                name={item.notifyEnabled ? 'bell' : 'bell-outline'}
                size={19}
                color={item.notifyEnabled ? SAVED_SEARCH_COLORS.primary : SAVED_SEARCH_COLORS.muted}
              />
            </Pressable>
            <Pressable
              onPress={onOpenMore}
              style={savedSearchesStyles.iconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Options for ${item.title}`}>
              <Icon name="dots-vertical" size={19} color={SAVED_SEARCH_COLORS.muted} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={savedSearchesStyles.titleRow}>
        <Text style={savedSearchesStyles.titleText} numberOfLines={2}>
          {item.title}
          {item.matchCount != null ? ` (${item.matchCount})` : ''}
        </Text>
        {item.newAdsCount > 0 ? (
          <View style={savedSearchesStyles.newAdsBadge}>
            <Text style={savedSearchesStyles.newAdsBadgeText}>{item.newAdsCount} new ads</Text>
          </View>
        ) : null}
      </View>

      <View style={savedSearchesStyles.bottomRow}>
        <View style={savedSearchesStyles.bottomLeft}>
          {item.tags.length ? (
            <View style={savedSearchesStyles.tagsRow}>
              {item.tags.map(tag => (
                <View key={tag} style={savedSearchesStyles.tag}>
                  <Text style={savedSearchesStyles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={savedSearchesStyles.savedOnText}>Saved on: {item.savedOnLabel}</Text>
        </View>

        <PreviewStack images={item.previewImages} />
      </View>
    </Pressable>
  ),
);

SavedSearchListItem.displayName = 'SavedSearchListItem';
