import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { AppTheme } from '../../theme/colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchChats } from '../../redux/slices/chatSlice';
import { getChatScreenStyles, ChatScreenStyles } from './chatScreenStyles';
import { RootStackParamList } from '../../navigation/types';
import { ChatFilter, ChatRow, filterThreads, mapThreadsToChatRows } from './chatTypes';

type ChatNav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: ChatFilter[] = ['All', 'Buying', 'Selling', 'Unread', 'Following'];

const VerifiedBadge: React.FC = () => (
  <Icon name="check-decagram" size={15} color="#2563EB" style={{ marginLeft: 2 }} />
);

const ProductChatRow: React.FC<{
  item: Extract<ChatRow, { kind: 'product' }>;
  onPress: () => void;
  styles: ChatScreenStyles;
  theme: AppTheme;
}> = ({ item, onPress, styles, theme }) => (
  <Pressable
    style={styles.row}
    android_ripple={{ color: theme.card }}
    onPress={onPress}
  >
    <View style={styles.productVisual}>
      <Image source={{ uri: item.productImageUri }} style={styles.productCircle} />
      <View style={styles.overlapAvatarWrap}>
        <Image source={{ uri: item.contactAvatarUri }} style={styles.overlapAvatar} />
        {item.overlapDot !== 'none' ? (
          <View
            style={[
              styles.overlapStatusDot,
              item.overlapDot === 'red' ? styles.dotRed : styles.dotGreen,
            ]}
          />
        ) : null}
      </View>
    </View>
    <View style={styles.rowText}>
      <Text style={styles.productTitle} numberOfLines={1}>
        {item.productTitle}
      </Text>
      <View style={styles.nameRow}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.contactName}
        </Text>
        {item.contactVerified ? <VerifiedBadge /> : null}
      </View>
      {item.unreadLabel ? (
        <Text style={styles.unreadLine} numberOfLines={1}>
          <Text style={styles.unreadBold}>{item.unreadLabel}</Text>
          {item.timeAgo ? ` • ${item.timeAgo}` : ''}
        </Text>
      ) : (
        <Text style={styles.previewGrey} numberOfLines={1}>
          {item.previewText || ' '}
        </Text>
      )}
    </View>
  </Pressable>
);

const DirectChatRow: React.FC<{
  item: Extract<ChatRow, { kind: 'direct' }>;
  onPress: () => void;
  styles: ChatScreenStyles;
  theme: AppTheme;
}> = ({ item, onPress, styles, theme }) => (
  <Pressable
    style={styles.row}
    android_ripple={{ color: theme.card }}
    onPress={onPress}>
    <View style={styles.directAvatarWrap}>
      <Image source={{ uri: item.avatarUri }} style={styles.directAvatar} />
      {item.showOnlineDot ? <View style={[styles.directOnlineDot, styles.dotGreen]} /> : null}
    </View>
    <View style={styles.rowText}>
      <Text style={styles.directName} numberOfLines={1}>
        {item.userName}
      </Text>
      <Text style={styles.activeStatus}>{item.activeStatus}</Text>
    </View>
  </Pressable>
);

export const ChatScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => getChatScreenStyles(theme), [theme]);
  const navigation = useNavigation<ChatNav>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const threads = useAppSelector(s => s.chat.threads);
  const loading = useAppSelector(s => s.chat.loading);
  const refreshing = useAppSelector(s => s.chat.refreshing);
  const error = useAppSelector(s => s.chat.error);
  const totalUnread = useAppSelector(s => s.chat.totalUnread);

  const [activeFilter, setActiveFilter] = useState<ChatFilter>('All');

  const headerPaddingTop = useMemo(() => Math.max(insets.top, 12), [insets.top]);

  const onRefresh = useCallback(() => {
    dispatch(fetchChats({ refresh: true }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchChats({ refresh: false }));
    }, [dispatch]),
  );

  const listData = useMemo(() => {
    const filtered = filterThreads(threads, activeFilter);
    return mapThreadsToChatRows(filtered);
  }, [threads, activeFilter]);

  const headerSubtitle = useMemo(() => {
    if (!isAuthenticated || isGuest) {
      return 'Sign in to see your messages';
    }
    if (totalUnread <= 0) {
      return 'No new messages';
    }
    return `${totalUnread} new message${totalUnread === 1 ? '' : 's'}`;
  }, [isAuthenticated, isGuest, totalUnread]);

  const headerAvatarUri = useMemo(() => {
    if (!user?.avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'You')}&size=128`;
    }
    return resolveMediaUrl(user.avatar);
  }, [user?.avatar, user?.name]);

  const openThread = useCallback(
    (id: string) => {
      navigation.getParent()?.navigate('ChatThread', { threadId: id });
    },
    [navigation],
  );

  const renderItem: ListRenderItem<ChatRow> = useCallback(
    ({ item }) => {
      if (item.kind === 'product') {
        return (
          <ProductChatRow
            item={item}
            styles={styles}
            theme={theme}
            onPress={() => openThread(item.id)}
          />
        );
      }
      return (
        <DirectChatRow
          item={item}
          styles={styles}
          theme={theme}
          onPress={() => openThread(item.id)}
        />
      );
    },
    [openThread, styles, theme],
  );

  const keyExtractor = useCallback((item: ChatRow) => item.id, []);

  const listEmpty = useMemo(() => {
    if (loading && listData.length === 0) {
      return (
        <View style={styles.centerMessage}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    if (!isAuthenticated || isGuest) {
      return (
        <View style={styles.centerMessage}>
          <Text style={styles.emptyTitle}>Messages</Text>
          <Text style={styles.emptyBody}>Log in to view and send messages about your listings.</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => dispatch(fetchChats({ refresh: true }))}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.emptyBody}>No conversations yet.</Text>
      </View>
    );
  }, [
    dispatch,
    error,
    isAuthenticated,
    isGuest,
    listData.length,
    loading,
    styles,
    theme.primary,
  ]);

  return (
    <View style={[styles.screen, { paddingTop: headerPaddingTop }]}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: headerAvatarUri }} style={styles.headerAvatar} />
            {totalUnread > 0 && isAuthenticated && !isGuest ? (
              <View style={styles.headerAvatarNotifyDot} />
            ) : null}
          </View>
          <View style={styles.headerTitles}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {user?.name ?? 'Messages'}
              </Text>
              {user?.isVerified ? <VerifiedBadge /> : null}
            </View>
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          </View>
        </View>
        <Pressable hitSlop={12} style={styles.headerIconBtn}>
          <Icon name="square-edit-outline" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}>
          {FILTERS.map(label => {
            const active = activeFilter === label;
            return (
              <Pressable
                key={label}
                onPress={() => setActiveFilter(label)}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.searchIconBtn} hitSlop={8}>
          <Icon name="magnify" size={22} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, listData.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      />
    </View>
  );
};
