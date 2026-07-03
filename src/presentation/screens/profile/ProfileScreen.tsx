import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ProfileActionButtons } from '../../components/profile/ProfileActionButtons';
import { ProfileBio } from '../../components/profile/ProfileBio';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfilePhotoActionSheet } from '../../components/profile/ProfilePhotoActionSheet';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { ProfileTabs } from '../../components/profile/ProfileTabs';
import { ProductGridCard } from '../../components/profile/ProductGridCard';
import { useProfileStyles } from '../../hooks/useProfileStyles';
import { useProfileData } from '../../hooks/useProfileData';
import { useAppDispatch } from '../../hooks/useRedux';
import { updateAuthUser } from '../../redux/slices/authSlice';
import { ProfileUserView, ProfileProductGridItem, ProfileTabKey } from '../../../types/profile.types';
import { requestMediaPermission, showPermissionAlert } from '../../../utils/mediaPermissions';
import {
  toUploadableProfileImage,
  validateProfileImage,
} from '../../../utils/profileImageValidation';
import { UserApi } from '../../../data/api/UserApi';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import { storage } from '../../../utils/storage';

const EmptyGrid: React.FC<{ tab: string }> = ({ tab }) => {
  const { styles, colors } = useProfileStyles();
  const copy =
    tab === 'saved'
      ? { title: 'No saved listings', subtitle: 'Bookmark products to see them here.' }
      : tab === 'liked'
        ? { title: 'No favorites yet', subtitle: 'Like listings to build your favorites grid.' }
        : { title: 'No posts yet', subtitle: 'Post your first ad to fill your profile grid.' };

  return (
    <View style={styles.emptyWrap}>
      <Icon name="package-variant" size={48} color={colors.iconMuted} />
      <Text style={styles.emptyTitle}>{copy.title}</Text>
      <Text style={styles.emptySubtitle}>{copy.subtitle}</Text>
    </View>
  );
};

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

type ProfileStaticHeaderProps = {
  profile: ProfileUserView;
  statsFormatted: {
    adsPosted: string;
    followers: string;
    following: string;
  };
  uploadingAvatar: boolean;
  onEditAvatar: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
  onMore: () => void;
};

const ProfileStaticHeader = memo<ProfileStaticHeaderProps>(
  ({
    profile,
    statsFormatted,
    uploadingAvatar,
    onEditAvatar,
    onEditProfile,
    onShareProfile,
    onMore,
  }) => (
    <Animated.View entering={FadeInDown.duration(380)}>
      <ProfileHeader
        profile={profile}
        onEditAvatar={onEditAvatar}
        uploadingAvatar={uploadingAvatar}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <ProfileStats stats={profile.stats} formatted={statsFormatted} />
        <ProfileActionButtons
          onEditProfile={onEditProfile}
          onShareProfile={onShareProfile}
          onMore={onMore}
        />
        <ProfileBio lines={profile.bioLines} />
      </View>
    </Animated.View>
  ),
);

ProfileStaticHeader.displayName = 'ProfileStaticHeader';

type ProfileListHeaderProps = {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
  profile: ProfileUserView;
  statsFormatted: ProfileStaticHeaderProps['statsFormatted'];
  uploadingAvatar: boolean;
  onEditAvatar: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
  onMore: () => void;
};

const ProfileListHeader = memo<ProfileListHeaderProps>(
  ({
    activeTab,
    onTabChange,
    profile,
    statsFormatted,
    uploadingAvatar,
    onEditAvatar,
    onEditProfile,
    onShareProfile,
    onMore,
  }) => (
    <>
      <ProfileStaticHeader
        profile={profile}
        statsFormatted={statsFormatted}
        uploadingAvatar={uploadingAvatar}
        onEditAvatar={onEditAvatar}
        onEditProfile={onEditProfile}
        onShareProfile={onShareProfile}
        onMore={onMore}
      />
      <ProfileTabs activeTab={activeTab} onChange={onTabChange} />
    </>
  ),
);

ProfileListHeader.displayName = 'ProfileListHeader';

export const ProfileScreen: React.FC = () => {
  const { styles, colors } = useProfileStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const photoSheetRef = useRef<BottomSheetModal>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const {
    profile,
    authUser,
    activeTab,
    items,
    reelProducts,
    loading,
    refreshing,
    loadingMore,
    statsFormatted,
    onTabChange,
    onRefresh,
    reloadProfileMeta,
    onLoadMore,
    setAvatarPreview,
  } = useProfileData();

  const persistAvatarToSession = useCallback(
    async (avatar: string | null | undefined) => {
      dispatch(updateAuthUser({ avatar: avatar ?? undefined }));
      const userJson = await storage.getString(STORAGE_KEYS.USER_DATA);
      if (!userJson) {
        return;
      }
      try {
        const parsed = JSON.parse(userJson) as Record<string, unknown>;
        if (avatar) {
          parsed.avatar = avatar;
        } else {
          delete parsed.avatar;
        }
        await storage.setString(STORAGE_KEYS.USER_DATA, JSON.stringify(parsed));
      } catch {
        // ignore stale user cache
      }
    },
    [dispatch],
  );

  const uploadAvatarAsset = useCallback(
    async (asset: Asset) => {
      const previousAvatar = profile.avatar ?? authUser?.avatar ?? null;
      const userName = authUser?.name ?? profile.name ?? '';
      const validation = validateProfileImage({
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      });
      if (!validation.valid) {
        Alert.alert('Invalid image', validation.error);
        return;
      }

      const nextPreview = asset.uri as string;
      setAvatarPreview(nextPreview);
      dispatch(updateAuthUser({ avatar: nextPreview }));
      setUploadingAvatar(true);

      try {
        const updated = await UserApi.updateProfileAvatar(
          toUploadableProfileImage({
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
          }),
          userName,
        );
        const finalAvatar = updated.avatar ?? nextPreview;
        setAvatarPreview(finalAvatar);
        await persistAvatarToSession(finalAvatar);
        dispatch(updateAuthUser({ avatar: finalAvatar }));
        await reloadProfileMeta();
        Alert.alert('Profile photo updated', 'Your profile picture has been updated.');
      } catch {
        setAvatarPreview(previousAvatar);
        dispatch(updateAuthUser({ avatar: previousAvatar ?? undefined }));
        Alert.alert('Upload failed', 'Could not update profile picture. Please try again.');
      } finally {
        setUploadingAvatar(false);
      }
    },
    [authUser?.avatar, authUser?.name, dispatch, persistAvatarToSession, profile.avatar, profile.name, reloadProfileMeta, setAvatarPreview],
  );

  const takePhoto = useCallback(async () => {
    if (uploadingAvatar) {
      return;
    }
    const status = await requestMediaPermission('camera');
    if (status !== 'granted') {
      showPermissionAlert('camera', status);
      return;
    }
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: false,
      saveToPhotos: false,
    });
    if (result.didCancel || !result.assets?.[0]) {
      return;
    }
    await uploadAvatarAsset(result.assets[0]);
  }, [uploadAvatarAsset, uploadingAvatar]);

  const pickFromGallery = useCallback(async () => {
    if (uploadingAvatar) {
      return;
    }
    const status = await requestMediaPermission('galleryImages');
    if (status !== 'granted') {
      showPermissionAlert('gallery', status);
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
    });
    if (result.didCancel || !result.assets?.[0]) {
      return;
    }
    await uploadAvatarAsset(result.assets[0]);
  }, [uploadAvatarAsset, uploadingAvatar]);

  const removePhoto = useCallback(() => {
    if (uploadingAvatar) {
      return;
    }
    Alert.alert('Remove photo', 'Remove your current profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const previousAvatar = profile.avatar ?? authUser?.avatar ?? null;
          setAvatarPreview(null);
          setUploadingAvatar(true);
          try {
            const updated = await UserApi.updateProfile({ avatar: null });
            const finalAvatar = updated.avatar ?? null;
            setAvatarPreview(finalAvatar);
            await persistAvatarToSession(finalAvatar);
            dispatch(updateAuthUser({ avatar: finalAvatar ?? undefined }));
            await reloadProfileMeta();
            Alert.alert('Removed', 'Profile photo removed.');
          } catch {
            setAvatarPreview(previousAvatar);
            dispatch(updateAuthUser({ avatar: previousAvatar ?? undefined }));
            Alert.alert('Update failed', 'Could not remove profile photo. Please try again.');
          } finally {
            setUploadingAvatar(false);
          }
        },
      },
    ]);
  }, [
    authUser?.avatar,
    persistAvatarToSession,
    profile.avatar,
    reloadProfileMeta,
    setAvatarPreview,
    uploadingAvatar,
  ]);

  const openAvatarSheet = useCallback(() => {
    if (uploadingAvatar) {
      return;
    }
    photoSheetRef.current?.present();
  }, [uploadingAvatar]);

  const openMoreMenu = useCallback(() => {
    navigation.navigate('MySettings');
  }, [navigation]);

  const onEditProfile = useCallback(() => {
    navigation.navigate('ProfileEdit');
  }, [navigation]);

  const onShareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${profile.name}'s profile on Preelly`,
      });
    } catch {
      // user dismissed share sheet
    }
  }, [profile.name]);

  const listHeader = useMemo(
    () => (
      <ProfileListHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        profile={profile}
        statsFormatted={statsFormatted}
        uploadingAvatar={uploadingAvatar}
        onEditAvatar={openAvatarSheet}
        onEditProfile={onEditProfile}
        onShareProfile={onShareProfile}
        onMore={openMoreMenu}
      />
    ),
    [
      activeTab,
      onEditProfile,
      onShareProfile,
      onTabChange,
      openMoreMenu,
      openAvatarSheet,
      profile,
      statsFormatted,
      uploadingAvatar,
    ],
  );

  const openReelFeed = useCallback(
    (productId: string, index: number) => {
      const profileUserId = profile.id;
      if (!profileUserId) {
        return;
      }
      navigation.navigate('UserFeed', {
        userId: profileUserId,
        initialProductId: productId,
        initialIndex: index,
        seedProducts: reelProducts,
        listingSource: activeTab === 'posts' ? 'posts' : activeTab,
        ownerMode: true,
      });
    },
    [activeTab, navigation, profile.id, reelProducts],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProfileProductGridItem; index: number }) => (
      <ProductGridCard item={item} index={index} onPress={() => openReelFeed(item.id, index)} />
    ),
    [openReelFeed],
  );

  const keyExtractor = useCallback((item: ProfileProductGridItem) => item.id, []);

  const listEmpty = useMemo(() => {
    if (loading && items.length === 0) {
      return <GridSkeleton />;
    }
    if (!loading && items.length === 0) {
      return <EmptyGrid tab={activeTab} />;
    }
    return null;
  }, [activeTab, items.length, loading]);

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
      <View style={profileTopBarStyles.wrap}>
        <View style={profileTopBarStyles.spacer} />
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          hitSlop={12}
          style={profileTopBarStyles.bellBtn}
          accessibilityRole="button"
          accessibilityLabel="Open notifications">
          <Icon name="bell-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={items.length ? styles.gridRow : undefined}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={footer}
        contentContainerStyle={styles.gridContent}
        extraData={activeTab}
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
      <ProfilePhotoActionSheet
        ref={photoSheetRef}
        hasAvatar={Boolean(authUser?.avatar)}
        busy={uploadingAvatar}
        onTakePhoto={takePhoto}
        onChooseGallery={pickFromGallery}
        onRemovePhoto={removePhoto}
      />
    </SafeAreaView>
  );
};

const profileTopBarStyles = {
  wrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  spacer: {
    flex: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
