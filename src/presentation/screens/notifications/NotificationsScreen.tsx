import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationItem, NotificationTab } from '../../../types/notification.types';
import { NotificationEmptyState } from '../../components/notifications/NotificationEmptyState';
import { NotificationFilterTabs } from '../../components/notifications/NotificationFilterTabs';
import { NotificationListItem } from '../../components/notifications/NotificationListItem';
import { NotificationSectionHeader } from '../../components/notifications/NotificationSectionHeader';
import { NotificationSkeleton } from '../../components/notifications/NotificationSkeleton';
import { NotificationSummaryCard } from '../../components/notifications/NotificationSummaryCard';
import { useNotificationActions, useNotifications } from '../../hooks/useNotifications';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { styles, colors } = useNotificationStyles();
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionLoadingType, setActionLoadingType] = useState<'accept' | 'reject' | null>(null);

  const {
    sections,
    followRequests,
    buyingUnread,
    sellingUnread,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
    error,
    items,
  } = useNotifications(activeTab);

  const {
    acceptFollow,
    rejectFollow,
    markRead,
    markReadLocally,
    removeLocally,
  } = useNotificationActions();

  const allUnread = useMemo(() => items.filter(item => !item.isRead).length, [items]);

  const openFollowRequests = useCallback(() => {
    navigation.navigate('FollowRequests');
  }, [navigation]);

  const handlePress = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.isRead) {
        markReadLocally(notification.id);
        void markRead(notification.id).catch(() => undefined);
      }

      if (notification.type === 'message') {
        const chatId = String(notification.data.chatId ?? '');
        if (chatId) {
          navigation.navigate('ChatThread', { threadId: chatId });
          return;
        }
      }

      if (notification.relatedProduct?.id) {
        navigation.navigate('ProductDetail', { productId: notification.relatedProduct.id });
        return;
      }

      if (notification.actor?.id && notification.type === 'follow') {
        navigation.navigate('OtherProfile', { userId: notification.actor.id });
      }
    },
    [markRead, markReadLocally, navigation],
  );

  const handleConfirm = useCallback(
    async (notification: NotificationItem) => {
      const followerId = String(notification.data.followerId ?? notification.actor?.id ?? '');
      if (!followerId) {
        return;
      }

      setActionLoadingId(notification.id);
      setActionLoadingType('accept');
      removeLocally(notification.id);

      try {
        await acceptFollow(followerId);
        Alert.alert('Follow request accepted', `${notification.actor?.name ?? 'User'} is now following you.`);
      } catch {
        await refetch();
        Alert.alert('Action failed', 'Could not accept the follow request. Please try again.');
      } finally {
        setActionLoadingId(null);
        setActionLoadingType(null);
      }
    },
    [acceptFollow, refetch, removeLocally],
  );

  const handleReject = useCallback(
    async (notification: NotificationItem) => {
      const followerId = String(notification.data.followerId ?? notification.actor?.id ?? '');
      if (!followerId) {
        return;
      }

      setActionLoadingId(notification.id);
      setActionLoadingType('reject');
      removeLocally(notification.id);

      try {
        await rejectFollow(followerId);
        Alert.alert('Follow request declined', 'The request was removed.');
      } catch {
        await refetch();
        Alert.alert('Action failed', 'Could not reject the follow request. Please try again.');
      } finally {
        setActionLoadingId(null);
        setActionLoadingType(null);
      }
    },
    [refetch, rejectFollow, removeLocally],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationListItem
        notification={item}
        actionLoadingId={actionLoadingId}
        actionLoadingType={actionLoadingType}
        onPress={handlePress}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    ),
    [actionLoadingId, actionLoadingType, handleConfirm, handlePress, handleReject],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <NotificationSectionHeader title={section.title} />
    ),
    [],
  );

  const listHeader = useMemo(
    () => (
      <>
        <NotificationSummaryCard requests={followRequests} onPress={openFollowRequests} />
        <NotificationFilterTabs
          activeTab={activeTab}
          buyingUnread={buyingUnread}
          sellingUnread={sellingUnread}
          allUnread={allUnread}
          onChange={setActiveTab}
        />
      </>
    ),
    [activeTab, allUnread, buyingUnread, followRequests, openFollowRequests, sellingUnread],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <NotificationSkeleton />;
    }
    if (isError) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>
            {(error as Error | undefined)?.message || 'Failed to load notifications.'}
          </Text>
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return <NotificationEmptyState />;
  }, [colors.primary, error, isError, isLoading, refetch, styles.errorText, styles.errorWrap]);

  const listFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null,
    [colors.primary, isFetchingNextPage, styles.footerLoader],
  );

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

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={8}
        removeClippedSubviews
        contentContainerStyle={sections.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </SafeAreaView>
  );
};
