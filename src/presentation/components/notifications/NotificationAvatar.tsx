import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationItem, NotificationType } from '../../../types/notification.types';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

const TYPE_META: Record<
  NotificationType,
  { icon: string; color: string }
> = {
  like: { icon: 'heart', color: '#EF4444' },
  comment: { icon: 'comment-outline', color: '#3B82F6' },
  follow: { icon: 'account-plus-outline', color: '#7C3AED' },
  follow_request: { icon: 'account-plus-outline', color: '#7C3AED' },
  message: { icon: 'message-outline', color: '#10B981' },
  order: { icon: 'shopping-outline', color: '#F97316' },
  listing: { icon: 'check', color: '#10B981' },
  system: { icon: 'bell-outline', color: '#94A3B8' },
};

interface Props {
  notification: NotificationItem;
}

export const NotificationAvatar = memo<Props>(({ notification }) => {
  const { styles } = useNotificationStyles();
  const meta = TYPE_META[notification.type] ?? TYPE_META.system;
  const actor = notification.actor;
  const avatarUri = getDisplayAvatarUri(actor?.avatar, actor?.name);

  if (!actor || notification.type === 'listing' || notification.type === 'system') {
    return (
      <View style={[styles.systemIcon, { backgroundColor: meta.color }]}>
        <Icon name={meta.icon} size={22} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.avatarWrap}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="account" size={24} color="#94A3B8" />
        </View>
      )}
      <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
        <Icon name={meta.icon} size={10} color="#FFFFFF" />
      </View>
    </View>
  );
});

NotificationAvatar.displayName = 'NotificationAvatar';

export const useNotificationDisplayText = (notification: NotificationItem): string => {
  return useMemo(() => {
    switch (notification.type) {
      case 'follow_request':
        return 'requested to follow you';
      case 'follow':
        return 'started following you';
      case 'message':
        return notification.relatedProduct?.title
          ? `sent you a message about '${notification.relatedProduct.title}'`
          : 'sent you a message';
      case 'like':
        return notification.relatedProduct?.title
          ? `liked your ad '${notification.relatedProduct.title}'`
          : notification.body || notification.title;
      case 'comment':
        return notification.body
          ? `commented on your ad '${notification.body}'`
          : notification.title;
      case 'listing':
        return notification.body || notification.title;
      default:
        return notification.body || notification.title;
    }
  }, [notification]);
};

interface NameProps {
  notification: NotificationItem;
}

export const NotificationPrimaryText = memo<NameProps>(({ notification }) => {
  const { styles } = useNotificationStyles();
  const message = useNotificationDisplayText(notification);
  const actorName = notification.actor?.name;

  if (actorName && notification.type !== 'listing' && notification.type !== 'system') {
    return (
      <Text style={styles.rowText} numberOfLines={3}>
        <Text style={styles.rowName}>{actorName} </Text>
        {message}
      </Text>
    );
  }

  return (
    <Text style={styles.rowText} numberOfLines={3}>
      {message}
    </Text>
  );
});

NotificationPrimaryText.displayName = 'NotificationPrimaryText';
