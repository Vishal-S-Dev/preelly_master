import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationItem } from '../../../types/notification.types';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

interface Props {
  requests: NotificationItem[];
  onPress: () => void;
}

export const NotificationSummaryCard = memo<Props>(({ requests, onPress }) => {
  const { styles, colors } = useNotificationStyles();

  if (!requests.length) {
    return null;
  }

  const firstName = requests[0]?.actor?.name ?? 'Someone';
  const othersCount = Math.max(0, requests.length - 1);
  const subtitle =
    othersCount > 0 ? `${firstName} + ${othersCount} others` : firstName;

  return (
    <Pressable
      style={styles.summaryCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Follow requests from ${subtitle}`}>
      <View style={styles.avatarStack}>
        {requests.slice(0, 3).map((request, index) => {
          const uri = getDisplayAvatarUri(request.actor?.avatar, request.actor?.name);
          return uri ? (
            <Image
              key={request.id}
              source={{ uri }}
              style={[styles.stackAvatar, index > 0 && styles.stackAvatarOverlap]}
            />
          ) : (
            <View
              key={request.id}
              style={[
                styles.stackAvatar,
                index > 0 && styles.stackAvatarOverlap,
                { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
              ]}>
              <Icon name="account" size={16} color={colors.muted} />
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.summaryTitle}>Follow requests</Text>
        <Text style={styles.summarySubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Icon name="chevron-right" size={22} color={colors.muted} />
    </Pressable>
  );
});

NotificationSummaryCard.displayName = 'NotificationSummaryCard';
