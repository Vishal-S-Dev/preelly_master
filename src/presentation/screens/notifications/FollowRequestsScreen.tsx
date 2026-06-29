import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationItem } from '../../../types/notification.types';
import { formatNotificationTimeAgo } from '../../../utils/notificationTime';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';
import { NotificationEmptyState } from '../../components/notifications/NotificationEmptyState';
import { useNotificationActions, useNotifications } from '../../hooks/useNotifications';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowRequests'>;

export const FollowRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const { styles, colors } = useNotificationStyles();
  const { followRequests, isLoading, isRefetching, refetch } = useNotifications('all');
  const { acceptFollow, rejectFollow, removeLocally } = useNotificationActions();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<'accept' | 'delete' | null>(null);

  const handleAccept = useCallback(
    async (notification: NotificationItem) => {
      const followerId = String(notification.data.followerId ?? notification.actor?.id ?? '');
      if (!followerId) {
        return;
      }

      setLoadingId(notification.id);
      setLoadingType('accept');
      removeLocally(notification.id);

      try {
        await acceptFollow(followerId);
        Alert.alert('Accepted', `${notification.actor?.name ?? 'User'} is now following you.`);
      } catch {
        await refetch();
        Alert.alert('Action failed', 'Could not accept the follow request.');
      } finally {
        setLoadingId(null);
        setLoadingType(null);
      }
    },
    [acceptFollow, refetch, removeLocally],
  );

  const handleDelete = useCallback(
    async (notification: NotificationItem) => {
      const followerId = String(notification.data.followerId ?? notification.actor?.id ?? '');
      if (!followerId) {
        return;
      }

      setLoadingId(notification.id);
      setLoadingType('delete');
      removeLocally(notification.id);

      try {
        await rejectFollow(followerId);
        Alert.alert('Deleted', 'Follow request removed.');
      } catch {
        await refetch();
        Alert.alert('Action failed', 'Could not delete the follow request.');
      } finally {
        setLoadingId(null);
        setLoadingType(null);
      }
    },
    [refetch, rejectFollow, removeLocally],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const avatarUri = getDisplayAvatarUri(item.actor?.avatar, item.actor?.name);
      const isLoadingRow = loadingId === item.id;

      return (
        <View style={styles.followRow}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="account" size={24} color={colors.muted} />
            </View>
          )}

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.rowName, { fontSize: 15 }]} numberOfLines={1}>
                {item.actor?.name ?? 'User'}
              </Text>
              {item.actor?.isVerified ? (
                <Icon name="check-decagram" size={15} color={colors.primary} />
              ) : null}
            </View>
            <Text style={styles.rowMeta}>requested to follow you</Text>
            <Text style={styles.rowMeta}>{formatNotificationTimeAgo(item.createdAt)}</Text>
          </View>

          <View style={styles.followActions}>
            <Pressable
              style={styles.acceptBtn}
              disabled={isLoadingRow}
              onPress={() => handleAccept(item)}
              accessibilityRole="button"
              accessibilityLabel={`Accept follow request from ${item.actor?.name ?? 'user'}`}>
              {isLoadingRow && loadingType === 'accept' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmText}>Accept</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.deleteBtn}
              disabled={isLoadingRow}
              onPress={() => handleDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Delete follow request from ${item.actor?.name ?? 'user'}`}>
              {isLoadingRow && loadingType === 'delete' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      );
    },
    [colors.muted, colors.primary, handleAccept, handleDelete, loadingId, loadingType, styles],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    return (
      <NotificationEmptyState
        title="No follow requests"
        subtitle="When someone requests to follow you, they will appear here."
      />
    );
  }, [colors.primary, isLoading, styles.footerLoader]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <Text style={styles.followScreenSectionTitle}>Follow request</Text>

      <FlatList
        data={followRequests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={8}
        removeClippedSubviews
        contentContainerStyle={followRequests.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </SafeAreaView>
  );
};
