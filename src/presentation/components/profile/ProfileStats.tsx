import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ProfileStats as ProfileStatsType } from '../../../types/profile.types';
import { formatProfileStatCount } from '../../../utils/profileStatsUtils';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  stats: ProfileStatsType;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export const ProfileStats = memo<Props>(({ stats, onPressFollowers, onPressFollowing }) => {
  const { styles } = useProfileStyles();

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatProfileStatCount(stats.adsPosted)}</Text>
        <Text style={styles.statLabel}>Ads Posted</Text>
      </View>
      <Pressable
        style={styles.statCol}
        onPress={onPressFollowers}
        disabled={!onPressFollowers}
        accessibilityRole={onPressFollowers ? 'button' : undefined}
        accessibilityLabel="Followers">
        <Text style={styles.statValue}>{formatProfileStatCount(stats.followers)}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </Pressable>
      <Pressable
        style={styles.statCol}
        onPress={onPressFollowing}
        disabled={!onPressFollowing}
        accessibilityRole={onPressFollowing ? 'button' : undefined}
        accessibilityLabel="Following">
        <Text style={styles.statValue}>{formatProfileStatCount(stats.following)}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </Pressable>
    </View>
  );
});

ProfileStats.displayName = 'ProfileStats';
