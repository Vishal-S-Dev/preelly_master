import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ShareRecipient } from '../../../types/share.types';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  users: ShareRecipient[];
  onRemove: (userId: string) => void;
}

export const SelectedUsersList = memo<Props>(({ users, onRemove }) => {
  if (!users.length) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.wrap}>
      {users.map(user => (
        <View key={user.id} style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {user.name}
          </Text>
          <Pressable
            onPress={() => onRemove(user.id)}
            hitSlop={8}
            accessibilityLabel={`Remove ${user.name}`}>
            <Icon name="close-circle" size={18} color={SHARE_UI.textMuted} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
});

SelectedUsersList.displayName = 'SelectedUsersList';

const styles = StyleSheet.create({
  wrap: {
    maxHeight: 44,
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SHARE_UI.chipBg,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    maxWidth: 140,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: SHARE_UI.text,
    flexShrink: 1,
  },
});
