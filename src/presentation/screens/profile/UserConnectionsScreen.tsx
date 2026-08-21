import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { UserConnectionListing } from '../../../types/profile.types';
import { profileService } from '../../../services/profile.service';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppSelector } from '../../hooks/useRedux';

type Props = NativeStackScreenProps<RootStackParamList, 'UserConnections'>;

export const UserConnectionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, mode, userName } = route.params;
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated && !s.auth.isGuest);
  const viewerUserId = useAppSelector(s => s.auth.user?.id ?? null);
  const isOwnList = Boolean(viewerUserId && viewerUserId === userId);

  const [items, setItems] = useState<UserConnectionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const result =
        mode === 'followers'
          ? await profileService.getFollowers(userId)
          : await profileService.getFollowing(userId);
      setItems(result);
      setError(null);
    } catch {
      setError(`Could not load ${mode}`);
    }
  }, [mode, userId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchList();
      setLoading(false);
    })();
  }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  }, [fetchList]);

  const openProfile = useCallback(
    (targetUserId: string) => {
      navigation.push('OtherProfile', { userId: targetUserId });
    },
    [navigation],
  );

  const handleFollow = useCallback(
    async (target: UserConnectionListing) => {
      if (!isAuthenticated) {
        Alert.alert('Sign in required', 'Please sign in to follow users.');
        return;
      }
      if (followBusyId) {
        return;
      }

      setFollowBusyId(target.id);
      try {
        const response = await profileService.toggleFollow(target.id);
        const nowFollowing = response.following;

        // Mirrors web: unfollowing someone from your OWN "Following" list removes them from
        // view immediately, since they no longer belong in that list.
        if (mode === 'following' && isOwnList && !nowFollowing) {
          setItems(prev => prev.filter(item => item.id !== target.id));
          return;
        }

        setItems(prev =>
          prev.map(item => (item.id === target.id ? { ...item, isFollowing: nowFollowing } : item)),
        );
      } catch {
        Alert.alert('Unable to update', 'Failed to follow user. Please try again.');
      } finally {
        setFollowBusyId(null);
      }
    },
    [followBusyId, isAuthenticated, isOwnList, mode],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserConnectionListing }) => {
      const isViewerRow = Boolean(viewerUserId && viewerUserId === item.id);
      const isBusy = followBusyId === item.id;

      return (
        <Pressable
          style={styles.row}
          android_ripple={{ color: theme.card }}
          onPress={() => openProfile(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}'s profile`}>
          {item.avatarUri ? (
            <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Icon name="account" size={wp('6%')} color={theme.subText} />
            </View>
          )}
          <View style={styles.rowBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1} allowFontScaling>
                {item.name}
              </Text>
              {item.isVerified ? (
                <Icon name="check-decagram" size={wp('3.8%')} color={theme.primary} />
              ) : null}
            </View>
            {item.email ? (
              <Text style={styles.meta} numberOfLines={1}>
                {item.email}
              </Text>
            ) : null}
            {item.rating > 0 ? (
              <Text style={styles.rating}>{'⭐'} {item.rating.toFixed(1)}</Text>
            ) : null}
          </View>

          {isViewerRow ? (
            <Text style={styles.youLabel}>You</Text>
          ) : (
            <Pressable
              style={[styles.followBtn, item.isFollowing ? styles.followingBtn : null]}
              disabled={isBusy}
              onPress={e => {
                e.stopPropagation();
                void handleFollow(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.isFollowing ? `Unfollow ${item.name}` : `Follow ${item.name}`}>
              {isBusy ? (
                <ActivityIndicator
                  size="small"
                  color={item.isFollowing ? theme.text : '#FFFFFF'}
                />
              ) : (
                <Text style={[styles.followBtnText, item.isFollowing ? styles.followingBtnText : null]}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </Pressable>
          )}
        </Pressable>
      );
    },
    [followBusyId, handleFollow, openProfile, styles, theme.card, theme.primary, theme.subText, theme.text, viewerUserId],
  );

  const listEmpty = useMemo(() => {
    if (loading) {
      return null;
    }
    return (
      <View style={styles.emptyWrap}>
        <Icon
          name={mode === 'followers' ? 'account-group-outline' : 'account-arrow-right-outline'}
          size={wp('11%')}
          color={theme.subText}
        />
        <Text style={styles.emptyTitle}>
          {error ?? (mode === 'followers' ? 'No followers yet' : 'Not following anyone yet')}
        </Text>
      </View>
    );
  }, [error, loading, mode, styles.emptyTitle, styles.emptyWrap, theme.subText]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={wp('7%')} color={theme.text} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {userName ? `${userName}'s ${mode === 'followers' ? 'Followers' : 'Following'}` : mode === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {items.length} {items.length === 1 ? 'person' : 'people'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          contentContainerStyle={items.length === 0 ? styles.emptyContent : undefined}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={8}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.2%'),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.subText}33`,
    },
    headerBtn: {
      width: wp('10%'),
      height: wp('10%'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: wp('4.6%'),
      fontWeight: '700',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: wp('3.2%'),
      color: theme.subText,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('1.4%'),
      gap: wp('3%'),
    },
    avatar: {
      width: wp('12.5%'),
      height: wp('12.5%'),
      borderRadius: wp('6.25%'),
      backgroundColor: theme.card,
    },
    avatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    name: {
      fontSize: wp('3.9%'),
      fontWeight: '600',
      color: theme.text,
      flexShrink: 1,
    },
    meta: {
      fontSize: wp('3.2%'),
      color: theme.subText,
      marginTop: 2,
    },
    rating: {
      fontSize: wp('3.2%'),
      color: '#B45309',
      marginTop: 2,
    },
    followBtn: {
      flexShrink: 0,
      minWidth: wp('22%'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('0.9%'),
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    followingBtn: {
      backgroundColor: theme.card,
    },
    followBtnText: {
      fontSize: wp('3.5%'),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    followingBtnText: {
      color: theme.text,
    },
    youLabel: {
      flexShrink: 0,
      fontSize: wp('3.5%'),
      color: theme.subText,
      paddingHorizontal: wp('2%'),
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContent: {
      flexGrow: 1,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp('8%'),
      gap: hp('1.2%'),
    },
    emptyTitle: {
      fontSize: wp('3.9%'),
      fontWeight: '600',
      color: theme.subText,
      textAlign: 'center',
    },
  });
