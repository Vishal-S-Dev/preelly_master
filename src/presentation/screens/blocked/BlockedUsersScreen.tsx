import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { BlockedUserListing, BlockSearchResultListing } from '../../../types/blockedUsers.types';
import { userSafetyService } from '../../../services/userSafety.service';
import { BlockConfirmSheet } from '../../components/blocked/BlockConfirmSheet';
import { BlockSearchResultRow } from '../../components/blocked/BlockSearchResultRow';
import { BlockedUserListItem } from '../../components/blocked/BlockedUserListItem';
import { useBlockSearch } from '../../hooks/useBlockSearch';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { BLOCKED_COLORS, blockedUsersStyles } from './blockedUsersStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'BlockedUsers'>;

export const BlockedUsersScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useStableSafeAreaInsets();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    busyId,
    refresh,
    loadMore,
    unblock,
    addBlockedUser,
    reload,
  } = useBlockedUsers();

  const [searchMode, setSearchMode] = useState(false);
  const excludeIds = useMemo(() => items.map(item => item.id), [items]);
  const { query, setQuery, results, loading: searching, error: searchError, isBelowMinLength, clear } =
    useBlockSearch(excludeIds);

  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const [pendingUser, setPendingUser] = useState<BlockSearchResultListing | null>(null);
  const [blocking, setBlocking] = useState(false);

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const openSearch = useCallback(() => setSearchMode(true), []);
  const closeSearch = useCallback(() => {
    clear();
    setSearchMode(false);
  }, [clear]);

  const onOpenBlockConfirm = useCallback((user: BlockSearchResultListing) => {
    setPendingUser(user);
    confirmSheetRef.current?.present();
  }, []);

  const onConfirmBlock = useCallback(() => {
    if (!pendingUser) {
      return;
    }
    setBlocking(true);
    userSafetyService
      .blockUser(pendingUser.id)
      .then(result => {
        addBlockedUser({
          id: pendingUser.id,
          name: pendingUser.name,
          avatarUri: pendingUser.avatarUri,
          usernameLabel: null,
          blockedOnLabel: null,
        });
        confirmSheetRef.current?.dismiss();
        closeSearch();
        Alert.alert('Blocked', result.message || `${pendingUser.name} blocked`);
      })
      .catch(err => {
        Alert.alert('Unable to block', err instanceof Error ? err.message : 'Failed to block user');
      })
      .finally(() => setBlocking(false));
  }, [addBlockedUser, closeSearch, pendingUser]);

  const onUnblock = useCallback(
    (item: BlockedUserListing) => {
      Alert.alert(
        `Unblock ${item.name}?`,
        `${item.name} and other accounts they may have or create will now be able to see your ads, follow and message you on Preelly. They won't be notified that you unblocked them.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: () => {
              unblock(item.id).catch(err =>
                Alert.alert('Unable to unblock', err instanceof Error ? err.message : 'Failed to unblock user'),
              );
            },
          },
        ],
      );
    },
    [unblock],
  );

  const header = (
    <View style={[blockedUsersStyles.header, { paddingTop: insets.top }]}>
      <Pressable onPress={onBack} style={blockedUsersStyles.headerBtn} hitSlop={8}>
        <Icon name="chevron-left" size={28} color={BLOCKED_COLORS.text} />
      </Pressable>
      <Text style={blockedUsersStyles.headerTitle}>Blocked Account</Text>
      <Pressable
        onPress={openSearch}
        style={blockedUsersStyles.headerBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Add user to block">
        <Icon name="plus" size={26} color={BLOCKED_COLORS.primary} />
      </Pressable>
    </View>
  );

  const searchBar = searchMode ? (
    <View style={blockedUsersStyles.searchRow}>
      <View style={blockedUsersStyles.searchBox}>
        <Icon name="magnify" size={20} color={BLOCKED_COLORS.faint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search contact and messages..."
          placeholderTextColor={BLOCKED_COLORS.faint}
          style={blockedUsersStyles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
        />
        <Pressable onPress={closeSearch} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close search">
          <Icon name="close" size={20} color={BLOCKED_COLORS.primary} />
        </Pressable>
      </View>
    </View>
  ) : null;

  const blockedEmpty = useMemo(
    () => (
      <View style={blockedUsersStyles.emptyWrap}>
        <Icon name="cancel" size={44} color={BLOCKED_COLORS.faint} />
        <Text style={blockedUsersStyles.emptyTitle}>You don't have any account blocked</Text>
        <Text style={blockedUsersStyles.emptySubtitle}>
          Looks like the kindness you show others comes right back to you.
        </Text>
        <Pressable onPress={openSearch} style={{ marginTop: 20 }}>
          <Text style={[blockedUsersStyles.emptyHint, { color: BLOCKED_COLORS.primary, fontWeight: '600' }]}>
            Add people to block list
          </Text>
        </Pressable>
      </View>
    ),
    [openSearch],
  );

  const searchEmpty = useMemo(() => {
    if (isBelowMinLength) {
      return <Text style={blockedUsersStyles.emptyHint}>Type at least 3 characters to search</Text>;
    }
    if (query.trim().length >= 3 && !searching) {
      return <Text style={blockedUsersStyles.emptyHint}>No users found</Text>;
    }
    return null;
  }, [isBelowMinLength, query, searching]);

  if (searchMode) {
    return (
      <View style={blockedUsersStyles.screen}>
        {header}
        {searchBar}
        {searchError ? <Text style={blockedUsersStyles.errorText}>{searchError}</Text> : null}
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={blockedUsersStyles.listContent}
          style={{ flex: 1 }}
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator color={BLOCKED_COLORS.primary} style={{ marginTop: 24 }} />
            ) : (
              searchEmpty
            )
          }
          renderItem={({ item }) => (
            <BlockSearchResultRow item={item} onBlock={() => onOpenBlockConfirm(item)} />
          )}
        />
        <BlockConfirmSheet
          ref={confirmSheetRef}
          user={pendingUser}
          busy={blocking}
          onConfirm={onConfirmBlock}
        />
      </View>
    );
  }

  return (
    <View style={blockedUsersStyles.screen}>
      {header}
      {loading && items.length === 0 ? (
        <View style={blockedUsersStyles.center}>
          <ActivityIndicator color={BLOCKED_COLORS.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={blockedUsersStyles.center}>
          <Text style={blockedUsersStyles.errorText}>{error}</Text>
          <Pressable onPress={reload}>
            <Text style={{ color: BLOCKED_COLORS.primary, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={blockedUsersStyles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={blockedEmpty}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={BLOCKED_COLORS.primary} style={blockedUsersStyles.footerLoader} />
            ) : null
          }
          renderItem={({ item }) => (
            <BlockedUserListItem
              item={item}
              busy={busyId === item.id}
              onUnblock={() => onUnblock(item)}
            />
          )}
        />
      )}
    </View>
  );
};
