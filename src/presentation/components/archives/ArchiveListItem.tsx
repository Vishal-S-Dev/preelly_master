import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ArchivedListing } from '../../../types/archives.types';
import { archivesStyles, ARCHIVE_COLORS } from '../../screens/archives/archivesStyles';

const formatDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

interface Props {
  item: ArchivedListing;
  busy?: boolean;
  onOpenMenu: () => void;
}

export const ArchiveListItem = memo<Props>(({ item, busy, onOpenMenu }) => {
  const archivedOn = formatDate(item.archivedAt);
  const updatedOn = formatDate(item.updatedAt);

  return (
    <View style={[archivesStyles.card, busy ? archivesStyles.cardBusy : null]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={archivesStyles.thumb} />
      ) : (
        <View style={[archivesStyles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="archive-outline" size={26} color={ARCHIVE_COLORS.faint} />
        </View>
      )}

      <View style={archivesStyles.cardBody}>
        <View style={archivesStyles.cardTopRow}>
          <Text style={archivesStyles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={archivesStyles.archivedPill}>
            <Text style={archivesStyles.archivedPillText}>Archived</Text>
          </View>
        </View>
        <Text style={archivesStyles.cardCategory} numberOfLines={1}>
          {item.categoryName}
        </Text>
        <Text style={archivesStyles.cardPrice}>{item.priceLabel}</Text>
        <View style={archivesStyles.cardMetaRow}>
          {item.location ? (
            <Text style={archivesStyles.cardMetaText} numberOfLines={1}>
              {item.location}
            </Text>
          ) : null}
          {archivedOn ? (
            <Text style={archivesStyles.cardMetaText}>Archived {archivedOn}</Text>
          ) : updatedOn ? (
            <Text style={archivesStyles.cardMetaText}>Updated {updatedOn}</Text>
          ) : null}
        </View>
      </View>

      {busy ? (
        <View style={archivesStyles.menuBtn}>
          <ActivityIndicator size="small" color={ARCHIVE_COLORS.primary} />
        </View>
      ) : (
        <Pressable
          onPress={onOpenMenu}
          style={archivesStyles.menuBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${item.title}`}>
          <Icon name="dots-vertical" size={20} color={ARCHIVE_COLORS.muted} />
        </Pressable>
      )}
    </View>
  );
});

ArchiveListItem.displayName = 'ArchiveListItem';
