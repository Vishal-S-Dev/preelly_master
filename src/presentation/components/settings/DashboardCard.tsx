import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';

interface Props {
  icon: string;
  title: string;
  count: number;
  onPress: () => void;
}

const formatCount = (value: number): string => String(Math.max(0, value)).padStart(2, '0');

export const DashboardCard = memo<Props>(({ icon, title, count, onPress }) => {
  const { styles, colors } = useSettingsStyles();

  return (
    <Pressable
      style={styles.gridCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} items`}>
      <Icon name={icon} size={28} color={colors.text} />
      <Text style={styles.gridTitle}>{title}</Text>
      <Text style={styles.gridCount}>{formatCount(count)}</Text>
    </Pressable>
  );
});

DashboardCard.displayName = 'DashboardCard';

export const DashboardCardSkeleton = memo(() => {
  const { styles } = useSettingsStyles();
  return <View style={styles.skeletonGridCard} />;
});

DashboardCardSkeleton.displayName = 'DashboardCardSkeleton';
