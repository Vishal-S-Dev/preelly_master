import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import AvatarIcon from '../../../../assets/icons/user.svg';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { CM_COLORS, cmStyles } from './commentsStyles';

interface Props {
  avatar?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const resolveCommentAvatarUri = (avatar?: string | null): string | undefined => {
  const trimmed = avatar?.trim();
  if (!trimmed) {
    return undefined;
  }
  return resolveMediaUrl(trimmed) || undefined;
};

export const CommentAvatar = memo<Props>(({ avatar, size = 36, style }) => {
  const resolvedUri = useMemo(() => resolveCommentAvatarUri(avatar), [avatar]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  const avatarStyle = [
    cmStyles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 0.5,
      borderColor: CM_COLORS.border,
    },
    style,
  ];

  if (!resolvedUri || failed) {
    return (
      <View style={avatarStyle}>
        <AvatarIcon width={size} height={size} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={avatarStyle}
      resizeMode="cover"
      resizeMethod="resize"
      fadeDuration={0}
      onError={onError}
      accessibilityIgnoresInvertColors
    />
  );
});

CommentAvatar.displayName = 'CommentAvatar';
