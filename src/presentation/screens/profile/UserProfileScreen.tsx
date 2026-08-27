import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { ProfileBio } from '../../components/profile/ProfileBio';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { ProductGridCard } from '../../components/profile/ProductGridCard';
import { UserProfileActionButtons } from '../../components/profile/UserProfileActionButtons';
import { ProfileMoreBottomSheet } from '../../components/profile/ProfileMoreBottomSheet';
import { ReportUserBottomSheet } from '../../components/profile/ReportUserBottomSheet';
import { useProfileStyles } from '../../hooks/useProfileStyles';
import { useOtherUserProfileData } from '../../hooks/useOtherUserProfileData';
import { useProductChatInit } from '../../hooks/useProductChatInit';
import { useAppSelector } from '../../hooks/useRedux';
import { userSafetyService } from '../../../services/userSafety.service';
import { ProfileProductGridItem } from '../../../types/profile.types';

type OtherProfileRoute = RouteProp<RootStackParamList, 'OtherProfile'>;

const GridSkeleton: React.FC = () => {
  const { styles } = useProfileStyles();
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`sk_${i}`} style={[styles.skeletonCell, { width: '32%', aspectRatio: 0.72 }]} />
      ))}
    </View>
  );
};

const EmptyGrid: React.FC = () => {
  const { styles, colors } = useProfileStyles();
  return (
    <View style={styles.emptyWrap}>
      <Icon name="package-variant" size={48} color={colors.iconMuted} />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>This user has not posted any listings.</Text>
    </View>
  );
};

export const UserProfileScreen: React.FC = () => {
  const { styles, colors } = useProfileStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OtherProfileRoute>();
  const userId = route.params.userId;
  const viewerUserId = useAppSelector(state => state.auth.user?.id ?? '');

  const {
    profile,
    items,
    reelProducts,
    loading,
    refreshing,
    loadingMore,
    followLoading,
    followStatusLoading,
    followState,
    error,
    onRefresh,
    onLoadMore,
    toggleFollow,
    isOwnProfile,
  } = useOtherUserProfileData(userId);

  const { openChat, openingChat } = useProductChatInit();

  const moreSheetRef = useRef<BottomSheetModal>(null);
  const reportSheetRef = useRef<BottomSheetModal>(null);

  const [safetyBusy, setSafetyBusy] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const refreshMuteState = useCallback(async () => {
    if (!userId || !viewerUserId || isOwnProfile) {
      setIsMuted(false);
      return;
    }
    try {
      const muted = await userSafetyService.areNotificationsMuted(userId, viewerUserId);
      setIsMuted(muted);
    } catch {
      // Keep last known state on transient failures.
    }
  }, [isOwnProfile, userId, viewerUserId]);

  useEffect(() => {
    void refreshMuteState();
  }, [refreshMuteState]);

  const onShareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${profile.name}'s profile on Preelly`,
      });
    } catch {
      // dismissed
    }
  }, [profile.name]);

  const onMessageUser = useCallback(() => {
    if (followState.status === 'blocked') {
      Alert.alert('Unavailable', 'Unblock this user to send them a message.');
      return;
    }
    const productId = items[0]?.id ?? reelProducts[0]?.id;
    void openChat(productId, userId);
  }, [followState.status, items, openChat, reelProducts, userId]);

  const openFollowers = useCallback(() => {
    navigation.navigate('UserConnections', { userId, mode: 'followers', userName: profile.name });
  }, [navigation, profile.name, userId]);

  const openFollowing = useCallback(() => {
    navigation.navigate('UserConnections', { userId, mode: 'following', userName: profile.name });
  }, [navigation, profile.name, userId]);

  const openMoreMenu = useCallback(() => {
    void refreshMuteState();
    moreSheetRef.current?.present();
  }, [refreshMuteState]);

  const handleBlock = useCallback(() => {
    const currentlyBlocked = followState.status === 'blocked';
    const displayName = profile.name?.trim() || 'this user';

    Alert.alert(
      currentlyBlocked ? 'Unblock user?' : 'Block user?',
      currentlyBlocked
        ? `${displayName} will be able to follow you again.`
        : `Block ${displayName}? They will no longer be able to follow you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentlyBlocked ? 'Unblock' : 'Block',
          style: currentlyBlocked ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              setSafetyBusy(true);
              try {
                const result = currentlyBlocked
                  ? await userSafetyService.unblockUser(userId)
                  : await userSafetyService.blockUser(userId);
                Alert.alert(result.blocked ? 'Blocked' : 'Unblocked', result.message);
                if (result.blocked) {
                  navigation.goBack();
                } else {
                  await onRefresh();
                }
              } catch (err) {
                Alert.alert(
                  'Unable to update',
                  err instanceof Error
                    ? err.message
                    : `Failed to ${currentlyBlocked ? 'unblock' : 'block'} user`,
                );
              } finally {
                setSafetyBusy(false);
              }
            })();
          },
        },
      ],
    );
  }, [followState.status, navigation, onRefresh, profile.name, userId]);

  const handleOpenReport = useCallback(() => {
    reportSheetRef.current?.present();
  }, []);

  const handleSubmitReport = useCallback(
    (payload: { reason: string; details: string }) => {
      void (async () => {
        setReportSubmitting(true);
        try {
          const result = await userSafetyService.reportUser({
            reportedUserId: userId,
            reason: payload.reason,
            details: payload.details,
            productId: items[0]?.id ?? reelProducts[0]?.id ?? null,
          });
          reportSheetRef.current?.dismiss();
          Alert.alert('Report submitted', result.message || 'Our team will review it.');
        } catch (err) {
          Alert.alert(
            'Unable to report',
            err instanceof Error ? err.message : 'Failed to submit report',
          );
        } finally {
          setReportSubmitting(false);
        }
      })();
    },
    [items, reelProducts, userId],
  );

  const handleMute = useCallback(() => {
    if (!viewerUserId) {
      Alert.alert('Sign in required', 'Please sign in to manage notifications.');
      return;
    }

    void (async () => {
      setSafetyBusy(true);
      try {
        const result = await userSafetyService.toggleMuteForUser(userId, viewerUserId);
        setIsMuted(result.muted);
        Alert.alert(result.muted ? 'Muted' : 'Unmuted', result.message);
      } catch (err) {
        Alert.alert(
          'Unable to update',
          err instanceof Error ? err.message : 'Failed to update notifications',
        );
      } finally {
        setSafetyBusy(false);
      }
    })();
  }, [userId, viewerUserId]);

  const listHeader = useMemo(
    () => (
      <Animated.View entering={FadeInDown.duration(380)}>
        <View style={styles.visitorTopBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.visitorBackBtn} hitSlop={10}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={onShareProfile} style={styles.visitorShareBtn}>
            <Text style={styles.visitorShareBtnText}>Share</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.visitorErrorText}>{error}</Text> : null}
        <ProfileHeader profile={profile} />
        <View style={{ paddingHorizontal: 20 }}>
          <ProfileStats
            stats={profile.stats}
            onPressFollowers={openFollowers}
            onPressFollowing={openFollowing}
          />
          {!isOwnProfile ? (
            <UserProfileActionButtons
              followState={followState}
              followLoading={followLoading}
              followStatusLoading={followStatusLoading}
              messageLoading={openingChat}
              onFollow={toggleFollow}
              onMessage={onMessageUser}
              onMore={openMoreMenu}
            />
          ) : null}
          <ProfileBio lines={profile.bioLines} />
        </View>
        {loading && items.length === 0 ? <GridSkeleton /> : null}
      </Animated.View>
    ),
    [
      error,
      followLoading,
      followStatusLoading,
      followState,
      items.length,
      loading,
      navigation,
      onMessageUser,
      openingChat,
      onShareProfile,
      openFollowers,
      openFollowing,
      openMoreMenu,
      profile,
      isOwnProfile,
      toggleFollow,
      styles,
      colors.text,
    ],
  );

  const openReelFeed = useCallback(
    (productId: string, index: number) => {
      navigation.navigate('UserFeed', {
        userId,
        initialProductId: productId,
        initialIndex: index,
        seedProducts: reelProducts,
        listingSource: 'posts',
      });
    },
    [navigation, reelProducts, userId],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProfileProductGridItem; index: number }) => (
      <ProductGridCard item={item} index={index} onPress={() => openReelFeed(item.id, index)} />
    ),
    [openReelFeed],
  );

  const keyExtractor = useCallback((item: ProfileProductGridItem) => item.id, []);

  const listEmpty = useMemo(() => {
    if (loading) {
      return null;
    }
    return <EmptyGrid />;
  }, [loading]);

  const footer = useMemo(
    () =>
      loadingMore ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null,
    [colors.primary, loadingMore, styles.footerLoader],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={loading && items.length === 0 ? [] : items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={items.length ? styles.gridRow : undefined}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={footer}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />

      {!isOwnProfile ? (
        <>
          <ProfileMoreBottomSheet
            ref={moreSheetRef}
            state={{
              isBlocked: followState.status === 'blocked',
              isMuted,
              busy: safetyBusy,
            }}
            onBlock={handleBlock}
            onReport={handleOpenReport}
            onMute={handleMute}
          />
          <ReportUserBottomSheet
            ref={reportSheetRef}
            userName={profile.name}
            submitting={reportSubmitting}
            onSubmit={handleSubmitReport}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
};
