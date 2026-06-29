import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

interface Props {
  title: string;
}

export const NotificationSectionHeader = memo<Props>(({ title }) => {
  const { styles } = useNotificationStyles();

  return (
    <View style={styles.sectionHeader} accessibilityRole="header">
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
});

NotificationSectionHeader.displayName = 'NotificationSectionHeader';
