import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { ProfileStats as ProfileStatsType } from '../../../types/profile.types';
import { formatProfileStatCount } from '../../../utils/profileStatsUtils';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  stats: ProfileStatsType;
}

export const ProfileStats = memo<Props>(({ stats }) => {
  const { styles } = useProfileStyles();

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatProfileStatCount(stats.adsPosted)}</Text>
        <Text style={styles.statLabel}>Ads Posted</Text>
      </View>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatProfileStatCount(stats.followers)}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statCol}>
        <Text style={styles.statValue}>{formatProfileStatCount(stats.following)}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
    </View>
  );
});

ProfileStats.displayName = 'ProfileStats';
