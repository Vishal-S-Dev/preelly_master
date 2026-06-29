import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SettingsProfileSummary } from '../../../types/settings.types';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';

interface Props {
  profile: SettingsProfileSummary;
  loading?: boolean;
  onAvatarPress: () => void;
  onGetVerified: () => void;
}

export const SettingsProfileSection = memo<Props>(
  ({ profile, loading = false, onAvatarPress, onGetVerified }) => {
    const { styles, colors } = useSettingsStyles();

    if (loading) {
      return (
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
          <View style={styles.profileMeta}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonVerified} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.profileRow}>
        <Pressable
          style={styles.avatarWrap}
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Edit profile photo">
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="account" size={34} color={colors.muted} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Icon name="account-edit-outline" size={13} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.profileMeta}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile.name}
          </Text>
          {!profile.isVerified ? (
            <Pressable
              style={styles.verifiedCard}
              onPress={onGetVerified}
              accessibilityRole="button"
              accessibilityLabel="Get verified">
              <Text style={styles.verifiedText}>Get Verified</Text>
              <Icon name="check-decagram" size={18} color={colors.primary} />
            </Pressable>
          ) : (
            <View style={[styles.verifiedCard, { borderStyle: 'solid', borderColor: colors.border }]}>
              <Text style={[styles.verifiedText, { color: colors.text }]}>Verified</Text>
              <Icon name="check-decagram" size={18} color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    );
  },
);

SettingsProfileSection.displayName = 'SettingsProfileSection';
