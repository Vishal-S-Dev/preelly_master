import React, { memo, useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SettingsProfileSummary } from '../../../types/settings.types';
import {
  getIdentityVerificationCardCopy,
  isIdentityVerificationCardClickable,
} from '../../screens/profile/edit/utils/identityVerificationUtils';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';

interface Props {
  profile: SettingsProfileSummary;
  loading?: boolean;
  onAvatarPress: () => void;
  onGetVerified: () => void;
}

const verificationVisual = (status: SettingsProfileSummary['verificationStatus']) => {
  switch (status) {
    case 'pending':
      return { icon: 'clock-outline', cardStyle: 'verifiedCardPending', textStyle: 'verifiedTextPending' };
    case 'rejected':
      return { icon: 'alert-circle-outline', cardStyle: 'verifiedCardRejected', textStyle: 'verifiedTextRejected' };
    case 'approved':
      return { icon: 'check-decagram', cardStyle: 'verifiedCardApproved', textStyle: null };
    case 'none':
    default:
      return { icon: 'check-decagram', cardStyle: null, textStyle: null };
  }
};

export const SettingsProfileSection = memo<Props>(
  ({ profile, loading = false, onAvatarPress, onGetVerified }) => {
    const { styles, colors } = useSettingsStyles();
    const copy = useMemo(
      () => getIdentityVerificationCardCopy(profile.verificationStatus),
      [profile.verificationStatus],
    );
    const visual = useMemo(
      () => verificationVisual(profile.verificationStatus),
      [profile.verificationStatus],
    );
    const isClickable = isIdentityVerificationCardClickable(profile.verificationStatus);
    const title =
      profile.verificationStatus === 'approved' ? 'Verified' : copy.title;

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

    const badgeContent = (
      <>
        <Text
          style={[
            styles.verifiedText,
            visual.textStyle ? styles[visual.textStyle as keyof typeof styles] : null,
            profile.verificationStatus === 'approved' ? { color: colors.text } : null,
          ]}>
          {title}
        </Text>
        <Icon
          name={visual.icon}
          size={18}
          color={
            profile.verificationStatus === 'pending'
              ? '#B45309'
              : profile.verificationStatus === 'rejected'
                ? colors.danger
                : colors.primary
          }
        />
      </>
    );

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

          {isClickable ? (
            <Pressable
              style={styles.verifiedCard}
              onPress={onGetVerified}
              accessibilityRole="button"
              accessibilityLabel="Get verified">
              {badgeContent}
            </Pressable>
          ) : (
            <View
              style={[
                styles.verifiedCard,
                visual.cardStyle ? styles[visual.cardStyle as keyof typeof styles] : null,
              ]}
              accessibilityRole="text"
              accessibilityLabel={title}>
              {badgeContent}
            </View>
          )}

          {copy.subtitle ? <Text style={styles.verifiedSubtitle}>{copy.subtitle}</Text> : null}
          {copy.message ? <Text style={styles.verifiedSubtitle}>{copy.message}</Text> : null}
          {profile.verificationStatus === 'rejected' && profile.rejectionReason ? (
            <Text style={[styles.verifiedSubtitle, { color: colors.danger }]}>
              {profile.rejectionReason}
            </Text>
          ) : null}
        </View>
      </View>
    );
  },
);

SettingsProfileSection.displayName = 'SettingsProfileSection';
