import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NotificationItem } from '../../../types/notification.types';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

interface Props {
  notification: NotificationItem;
  loadingAction?: 'accept' | 'reject' | null;
  onConfirm: (notification: NotificationItem) => void;
  onReject: (notification: NotificationItem) => void;
}

export const FollowRequestCard = memo<Props>(
  ({ notification, loadingAction, onConfirm, onReject }) => {
    const { styles, colors } = useNotificationStyles();

    return (
      <View style={styles.actionRow}>
        <Pressable
          style={styles.confirmBtn}
          disabled={Boolean(loadingAction)}
          onPress={() => onConfirm(notification)}
          accessibilityRole="button"
          accessibilityLabel={`Confirm follow request from ${notification.actor?.name ?? 'user'}`}>
          {loadingAction === 'accept' ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.rejectBtn}
          disabled={Boolean(loadingAction)}
          onPress={() => onReject(notification)}
          accessibilityRole="button"
          accessibilityLabel={`Reject follow request from ${notification.actor?.name ?? 'user'}`}>
          {loadingAction === 'reject' ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <IconClose />
          )}
        </Pressable>
      </View>
    );
  },
);

const IconClose = () => {
  const { colors } = useNotificationStyles();
  return <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>×</Text>;
};

FollowRequestCard.displayName = 'FollowRequestCard';
