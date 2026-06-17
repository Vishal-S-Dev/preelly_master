import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { ProfileUserView } from '../../../types/profile.types';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';
import { useProfileStyles } from '../../hooks/useProfileStyles';
import { ProfileRating } from './ProfileRating';

interface Props {
  profile: ProfileUserView;
  onEditAvatar?: () => void;
  uploadingAvatar?: boolean;
}

export const ProfileHeader = memo<Props>(({ profile, onEditAvatar, uploadingAvatar = false }) => {
  const { styles, colors } = useProfileStyles();
  const avatarUri = getDisplayAvatarUri(profile.avatar, profile.name);

  return (
    <Animated.View entering={FadeIn.duration(420)} style={styles.headerBlock}>
      <Animated.View entering={ZoomIn.duration(500)} style={styles.avatarWrap}>
        <View style={styles.avatarRing}>
          {avatarUri ? (
            <Image key={avatarUri} source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="account" size={42} color={colors.muted} />
            </View>
          )}
        </View>
        <Pressable
          style={styles.editBadge}
          hitSlop={8}
          onPress={onEditAvatar}
          disabled={uploadingAvatar}
          accessibilityLabel="Edit profile photo"
          accessibilityRole="button"
          accessibilityState={{ disabled: uploadingAvatar }}>
          {uploadingAvatar ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Icon name="pencil" size={12} color={colors.bg} />
          )}
        </Pressable>
      </Animated.View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{profile.name}</Text>
        {profile.isVerified ? (
          <Icon name="check-decagram" size={20} color={colors.verified} />
        ) : null}
      </View>

      <ProfileRating rating={profile.rating} />
    </Animated.View>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
