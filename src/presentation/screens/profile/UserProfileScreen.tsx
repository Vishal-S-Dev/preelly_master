import React, { useCallback, useMemo } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { ProfileBio } from '../../components/profile/ProfileBio';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
//import { ProfileTabs } from '../../components/profile/ProfileTabs';
import { ProductGridCard } from '../../components/profile/ProductGridCard';
import { UserProfileActionButtons } from '../../components/profile/UserProfileActionButtons';
import { useProfileStyles } from '../../hooks/useProfileStyles';
import { useOtherUserProfileData } from '../../hooks/useOtherUserProfileData';
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
    Alert.alert('Message', 'Chat will open here.');
  }, []);

  const openMoreMenu = useCallback(() => {
    Alert.alert('Profile options', undefined, [
      { text: 'Report' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

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
          <ProfileStats stats={profile.stats} />
          {!isOwnProfile ? (
            <UserProfileActionButtons
              followState={followState}
              followLoading={followLoading}
              followStatusLoading={followStatusLoading}
              onFollow={toggleFollow}
              onMessage={onMessageUser}
              onMore={openMoreMenu}
            />
          ) : null}
          <ProfileBio lines={profile.bioLines} />
        </View>
        {/*<ProfileTabs activeTab="posts" onChange={() => undefined} variant="visitor" />*/}
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
      onShareProfile,
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
    </SafeAreaView>
  );
};
