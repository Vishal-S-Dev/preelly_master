import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DraftListing } from '../../hooks/useMyDrafts';
import { draftsStyles, DRAFT_COLORS } from '../../screens/drafts/draftsStyles';

interface Props {
  draft: DraftListing;
  onOpenMenu: () => void;
}

export const DraftListItem = memo<Props>(({ draft, onOpenMenu }) => (
  <View style={draftsStyles.card}>
    {draft.thumbnailUri ? (
      <Image source={{ uri: draft.thumbnailUri }} style={draftsStyles.thumb} />
    ) : (
      <View style={[draftsStyles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="file-document-outline" size={26} color={DRAFT_COLORS.faint} />
      </View>
    )}

    <View style={draftsStyles.cardBody}>
      <Text style={draftsStyles.cardTitle} numberOfLines={1}>
        {draft.title}
      </Text>
      <Text style={draftsStyles.cardCategory} numberOfLines={1}>
        {draft.categoryLabel}
      </Text>
      <Text style={draftsStyles.cardPrice}>{draft.priceLabel}</Text>
    </View>

    <Pressable
      onPress={onOpenMenu}
      style={draftsStyles.menuBtn}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Options for ${draft.title}`}>
      <Icon name="dots-vertical" size={20} color={DRAFT_COLORS.muted} />
    </Pressable>
  </View>
));

DraftListItem.displayName = 'DraftListItem';
