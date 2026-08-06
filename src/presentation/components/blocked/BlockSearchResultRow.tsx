import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlockSearchResultListing } from '../../../types/blockedUsers.types';
import { BLOCKED_COLORS, blockedUsersStyles } from '../../screens/blocked/blockedUsersStyles';

interface Props {
  item: BlockSearchResultListing;
  busy?: boolean;
  onBlock: () => void;
}

export const BlockSearchResultRow = memo<Props>(({ item, busy, onBlock }) => (
  <View style={blockedUsersStyles.row}>
    {item.avatarUri ? (
      <Image source={{ uri: item.avatarUri }} style={blockedUsersStyles.avatar} />
    ) : (
      <View style={[blockedUsersStyles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="account" size={24} color={BLOCKED_COLORS.faint} />
      </View>
    )}

    <View style={blockedUsersStyles.rowBody}>
      <Text style={blockedUsersStyles.rowName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>

    <Pressable
      style={blockedUsersStyles.actionPill}
      onPress={onBlock}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`Block ${item.name}`}>
      {busy ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={blockedUsersStyles.actionPillText}>Block</Text>
      )}
    </Pressable>
  </View>
));

BlockSearchResultRow.displayName = 'BlockSearchResultRow';
