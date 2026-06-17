import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { ProfileStats as ProfileStatsType } from '../../../types/profile.types';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  stats: ProfileStatsType;
  formatted: {
    adsPosted: string;
    followers: string;
    following: string;
  };
}

export const ProfileStats = memo<Props>(({ stats, formatted }) => {
  const { styles } = useProfileStyles();

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatted.adsPosted}</Text>
        <Text style={styles.statLabel}>ads Posted</Text>
      </View>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatted.followers}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatted.following}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
    </View>
  );
});

ProfileStats.displayName = 'ProfileStats';
