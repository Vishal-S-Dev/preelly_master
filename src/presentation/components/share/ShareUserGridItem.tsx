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

/** Instagram-style overlapping circles for a group: back avatar top-left, front avatar
 * bottom-right with a white ring separating them. Falls back to whichever single avatar is
 * available if the group has fewer than 2 other members with a resolvable photo. */
const GroupAvatarPair: React.FC<{ user: ShareRecipient; avatarSize: number }> = ({
  user,
  avatarSize,
}) => {
  const uris = (user.groupAvatarUrls ?? [])
    .map(uri => resolveShareAvatarUri(uri))
    .filter((uri): uri is string => Boolean(uri));
  const fallbackUri = resolveShareAvatarUri(user.avatarUrl);
  const [backUri, frontUri] = uris.length > 0 ? uris : [fallbackUri, undefined];

  if (uris.length < 2) {
    // Only one (or zero) resolvable member avatar — a single circle reads better than a lone
    // overlapping face, so fall back to the plain avatar rendering.
    return (
      <SingleAvatar
        uri={backUri}
        size={avatarSize}
        fallbackIconSize={avatarSize}
      />
    );
  }

  const faceSize = avatarSize * 0.72;
  return (
    <View style={{ width: avatarSize, height: avatarSize }}>
      <View
        style={[
          styles.groupFace,
          styles.groupFaceBack,
          { width: faceSize, height: faceSize, borderRadius: faceSize / 2 },
        ]}>
        <SingleAvatar uri={backUri} size={faceSize} fallbackIconSize={faceSize} />
      </View>
      <View
        style={[
          styles.groupFace,
          styles.groupFaceFront,
          { width: faceSize, height: faceSize, borderRadius: faceSize / 2 },
        ]}>
        <SingleAvatar uri={frontUri} size={faceSize} fallbackIconSize={faceSize} />
      </View>
    </View>
  );
};

const SingleAvatar: React.FC<{
  uri?: string;
  size: number;
  fallbackIconSize: number;
}> = ({ uri, size, fallbackIconSize }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const onError = useCallback(() => setFailed(true), []);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
        resizeMethod="resize"
        fadeDuration={0}
        onError={onError}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <AvatarIcon width={fallbackIconSize} height={fallbackIconSize} />
    </View>
  );
};

export const ShareUserGridItem = memo<Props>(({ user, selected, onToggle, avatarSize = AVATAR_SIZE, horizontal = false }) => {
  const resolvedUri = useMemo(() => resolveShareAvatarUri(user.avatarUrl), [user.avatarUrl]);
  const isGroup = user.kind === 'group';
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
        {isGroup ? (
          <GroupAvatarPair user={user} avatarSize={avatarSize} />
        ) : resolvedUri && !failed ? (
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
  groupFace: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
  groupFaceBack: {
    top: 0,
    left: 0,
  },
  groupFaceFront: {
    bottom: 0,
    right: 0,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
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
