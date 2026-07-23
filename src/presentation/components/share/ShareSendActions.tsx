import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShareRecipient } from '../../../types/share.types';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { SHARE_UI } from './shareSheetStyles';

const MINI_AVATAR = 26;

interface Props {
  selectedUsers: ShareRecipient[];
  sending: boolean;
  onSendIndividual: () => void;
  onSendGroup: () => void;
}

const resolveAvatar = (user: ShareRecipient): string | undefined => {
  const uri = user.avatarUrl?.trim();
  if (!uri || uri.includes('ui-avatars.com') || uri.includes('i.pravatar.cc')) {
    return undefined;
  }
  return resolveMediaUrl(uri) || undefined;
};

const AvatarStack = memo<{ users: ShareRecipient[] }>(({ users }) => {
  const faces = users.slice(0, 3);
  return (
    <View style={styles.stackWrap}>
      {faces.map((user, index) => {
        const uri = resolveAvatar(user);
        return (
          <View
            key={user.id}
            style={[
              styles.stackAvatar,
              { marginLeft: index === 0 ? 0 : -10, zIndex: faces.length - index },
            ]}>
            {uri ? (
              <Image source={{ uri }} style={styles.stackImage} />
            ) : (
              <View style={[styles.stackImage, styles.stackFallback]}>
                <Text style={styles.stackInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
});

AvatarStack.displayName = 'ShareAvatarStack';

export const ShareSendActions = memo<Props>(
  ({ selectedUsers, sending, onSendIndividual, onSendGroup }) => {
    const count = selectedUsers.length;

    if (count === 0) {
      return null;
    }

    if (count === 1) {
      return (
        <Pressable
          style={[styles.sendBtn, styles.sendBtnPrimary, styles.sendBtnFull, sending && styles.disabled]}
          disabled={sending}
          onPress={onSendIndividual}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnPrimaryText}>Send</Text>
          )}
        </Pressable>
      );
    }

    return (
      <View style={styles.dualRow}>
        <Pressable
          style={[styles.sendBtn, styles.sendBtnPrimary, sending && styles.disabled]}
          disabled={sending}
          onPress={onSendIndividual}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnPrimaryText}>Send individual</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.sendBtn, styles.sendBtnGroup, sending && styles.disabled]}
          disabled={sending}
          onPress={onSendGroup}>
          {sending ? (
            <ActivityIndicator color={SHARE_UI.primary} />
          ) : (
            <View style={styles.groupBtnInner}>
              <AvatarStack users={selectedUsers} />
              <Text style={styles.sendBtnGroupText}>Send Group</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  },
);

ShareSendActions.displayName = 'ShareSendActions';

const styles = StyleSheet.create({
  dualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sendBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  sendBtnFull: {
    flex: 0,
    width: '100%',
  },
  sendBtnPrimary: {
    backgroundColor: SHARE_UI.primary,
  },
  sendBtnGroup: {
    backgroundColor: SHARE_UI.primaryLight,
    flex: 1.05,
  },
  sendBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sendBtnGroupText: {
    color: SHARE_UI.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  groupBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    borderWidth: 2,
    borderColor: SHARE_UI.primaryLight,
    borderRadius: MINI_AVATAR / 2 + 2,
  },
  stackImage: {
    width: MINI_AVATAR,
    height: MINI_AVATAR,
    borderRadius: MINI_AVATAR / 2,
    backgroundColor: '#CBD5E1',
  },
  stackFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#94A3B8',
  },
  stackInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});
