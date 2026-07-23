import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AvatarIcon from '../../../../assets/icons/user.svg';
import { ShareRecipient } from '../../../types/share.types';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  user: ShareRecipient;
  selected: boolean;
  onToggle: (user: ShareRecipient) => void;
  avatarSize?: number;
  horizontal?: boolean;
}

const AVATAR_SIZE = 72;

const resolveShareAvatarUri = (avatarUrl?: string | null): string | undefined => {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) {
    return undefined;
  }
  // Skip legacy placeholder hosts so we fall back to the local SVG.
  if (trimmed.includes('i.pravatar.cc') || trimmed.includes('ui-avatars.com')) {
    return undefined;
  }
  return resolveMediaUrl(trimmed) || undefined;
};

export const ShareUserGridItem = memo<Props>(({ user, selected, onToggle, avatarSize = AVATAR_SIZE, horizontal = false }) => {
  const resolvedUri = useMemo(() => resolveShareAvatarUri(user.avatarUrl), [user.avatarUrl]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1 : 0, { damping: 14 }) }],
    opacity: selected ? 1 : 0,
  }));

  return (
    <Pressable
      style={[styles.cell, horizontal && styles.cellHorizontal]}
      onPress={() => onToggle(user)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${user.name}, ${selected ? 'selected' : 'not selected'}`}>
      <View style={styles.avatarWrap}>
        {resolvedUri && !failed ? (
          <Image
            source={{ uri: resolvedUri }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
            onError={onError}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            <AvatarIcon width={avatarSize} height={avatarSize} />
          </View>
        )}
        {user.isOnline ? <View style={styles.onlineDot} /> : null}
        <Animated.View style={[styles.checkBadge, badgeStyle]}>
          <Icon name="check" size={14} color="#fff" />
        </Animated.View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {user.name}
      </Text>
    </Pressable>
  );
});

ShareUserGridItem.displayName = 'ShareUserGridItem';

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    maxWidth: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cellHorizontal: {
    flex: 0,
    maxWidth: undefined,
    width: 88,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: SHARE_UI.chipBg,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  avatarFallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SHARE_UI.checkBlue,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: SHARE_UI.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
