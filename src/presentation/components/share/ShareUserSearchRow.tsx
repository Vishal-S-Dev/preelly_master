import React, { memo, useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AvatarIcon from '../../../../assets/icons/user.svg';
import { ShareRecipient } from '../../../types/share.types';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { SHARE_UI } from './shareSheetStyles';

const AVATAR_SIZE = wp('13%');

interface Props {
  user: ShareRecipient;
  selected: boolean;
  onToggle: (user: ShareRecipient) => void;
}

const resolveAvatarUri = (avatarUrl?: string | null): string | undefined => {
  const trimmed = avatarUrl?.trim();
  if (!trimmed || trimmed.includes('i.pravatar.cc') || trimmed.includes('ui-avatars.com')) {
    return undefined;
  }
  return resolveMediaUrl(trimmed) || undefined;
};

export const ShareUserSearchRow = memo<Props>(({ user, selected, onToggle }) => {
  const resolvedUri = resolveAvatarUri(user.avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  const onError = useCallback(() => setFailed(true), []);

  return (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(user)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${user.name}, ${selected ? 'selected' : 'not selected'}`}>
      {resolvedUri && !failed ? (
        <Image
          source={{ uri: resolvedUri }}
          style={styles.avatar}
          resizeMode="cover"
          onError={onError}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <AvatarIcon width={AVATAR_SIZE} height={AVATAR_SIZE} />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        {user.username ? (
          <Text style={styles.username} numberOfLines={1}>
            {user.username}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.checkBadge}>
          <Icon name="check" size={wp('3.5%')} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
});

ShareUserSearchRow.displayName = 'ShareUserSearchRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    gap: wp('3%'),
    minHeight: hp('7%'),
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: SHARE_UI.chipBg,
  },
  avatarFallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: wp('3.9%'),
    fontWeight: '600',
    color: SHARE_UI.text,
  },
  username: {
    fontSize: wp('3.4%'),
    color: SHARE_UI.textMuted,
    marginTop: 2,
  },
  checkBadge: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: SHARE_UI.checkBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
