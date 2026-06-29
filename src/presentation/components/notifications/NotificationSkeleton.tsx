import React, { memo } from 'react';
import { View } from 'react-native';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

export const NotificationSkeleton = memo(() => {
  const { styles } = useNotificationStyles();

  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={`sk_${index}`} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: '78%' }]} />
            <View style={[styles.skeletonLine, { width: '34%' }]} />
          </View>
          <View style={[styles.skeletonAvatar, { width: 52, height: 52, borderRadius: 10 }]} />
        </View>
      ))}
    </>
  );
});

NotificationSkeleton.displayName = 'NotificationSkeleton';
