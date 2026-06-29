import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

interface Props {
  title?: string;
  subtitle?: string;
}

export const NotificationEmptyState = memo<Props>(
  ({ title = 'No notifications yet', subtitle = 'Activity like likes, comments and follows will appear here.' }) => {
    const { styles, colors } = useNotificationStyles();

    return (
      <View style={styles.emptyWrap} accessibilityRole="text">
        <Icon name="bell-outline" size={52} color={colors.muted} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>
    );
  },
);

NotificationEmptyState.displayName = 'NotificationEmptyState';
