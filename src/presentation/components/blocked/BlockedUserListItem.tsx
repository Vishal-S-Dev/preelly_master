import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlockedUserListing } from '../../../types/blockedUsers.types';
import { BLOCKED_COLORS, blockedUsersStyles } from '../../screens/blocked/blockedUsersStyles';

interface Props {
  item: BlockedUserListing;
  busy?: boolean;
  onUnblock: () => void;
}

export const BlockedUserListItem = memo<Props>(({ item, busy, onUnblock }) => (
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
      {item.usernameLabel || item.blockedOnLabel ? (
        <Text style={blockedUsersStyles.rowMeta} numberOfLines={1}>
          {[item.usernameLabel, item.blockedOnLabel ? `Blocked ${item.blockedOnLabel}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
    </View>

    <Pressable
      style={blockedUsersStyles.actionPill}
      onPress={onUnblock}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`Unblock ${item.name}`}>
      {busy ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={blockedUsersStyles.actionPillText}>Unblock</Text>
      )}
    </Pressable>
  </View>
));

BlockedUserListItem.displayName = 'BlockedUserListItem';
