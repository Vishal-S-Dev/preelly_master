import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationItem } from '../../../types/notification.types';
import { formatNotificationTimeAgo } from '../../../utils/notificationTime';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';
import { FollowRequestCard } from './FollowRequestCard';
import { NotificationAvatar, NotificationPrimaryText } from './NotificationAvatar';

interface Props {
  notification: NotificationItem;
  actionLoadingId?: string | null;
  actionLoadingType?: 'accept' | 'reject' | null;
  onPress: (notification: NotificationItem) => void;
  onConfirm?: (notification: NotificationItem) => void;
  onReject?: (notification: NotificationItem) => void;
}

export const NotificationListItem = memo<Props>(
  ({
    notification,
    actionLoadingId,
    actionLoadingType,
    onPress,
    onConfirm,
    onReject,
  }) => {
    const { styles, colors } = useNotificationStyles();
    const thumbUri =
      notification.relatedProduct?.imageUrl ?? notification.relatedProduct?.videoUrl ?? null;
    const isFollowRequest = notification.type === 'follow_request';
    const loadingAction =
      actionLoadingId === notification.id ? actionLoadingType ?? null : null;

    return (
      <Pressable
        style={[styles.row, !notification.isRead && styles.rowUnread]}
        onPress={() => onPress(notification)}
        accessibilityRole="button"
        accessibilityLabel={`Notification from ${notification.actor?.name ?? 'system'}`}>
        <NotificationAvatar notification={notification} />

        <View style={styles.rowContent}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <View style={{ flex: 1 }}>
              <NotificationPrimaryText notification={notification} />
              {notification.type === 'message' && notification.body ? (
                <Text style={[styles.rowMeta, { marginTop: 4 }]} numberOfLines={2}>
                  "{notification.body}"
                </Text>
              ) : null}
            </View>
            {notification.actor?.isVerified ? (
              <Icon name="check-decagram" size={16} color={colors.primary} />
            ) : null}
          </View>

          <Text style={styles.rowMeta}>{formatNotificationTimeAgo(notification.createdAt)}</Text>

          {notification.type === 'comment' ? (
            <Pressable style={styles.replyBtn} accessibilityRole="button" accessibilityLabel="Reply">
              <Icon name="reply-outline" size={14} color={colors.muted} />
              <Text style={styles.replyText}>Reply</Text>
            </Pressable>
          ) : null}

          {isFollowRequest && onConfirm && onReject ? (
            <FollowRequestCard
              notification={notification}
              loadingAction={loadingAction}
              onConfirm={onConfirm}
              onReject={onReject}
            />
          ) : null}
        </View>

        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumb} resizeMode="cover" />
        ) : null}
      </Pressable>
    );
  },
);

NotificationListItem.displayName = 'NotificationListItem';
