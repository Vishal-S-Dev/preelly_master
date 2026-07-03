import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Dimensions,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useProductChatInit } from '../../hooks/useProductChatInit';
import { useAppDispatch } from '../../hooks/useRedux';
import { likeProduct, saveProduct } from '../../redux/slices/productSlice';
import { ProductImageCarousel } from '../../components/productDetail/ProductImageCarousel';
import { ProductHeaderCard } from '../../components/productDetail/ProductHeaderCard';
import { ProductStatsRow } from '../../components/productDetail/ProductStatsRow';
import { ProductOverviewGrid } from '../../components/productDetail/ProductOverviewGrid';
import { ProductDescription } from '../../components/productDetail/ProductDescription';
import { ProductFeaturesAccordion } from '../../components/productDetail/ProductFeaturesAccordion';
import { ProductLocationCard } from '../../components/productDetail/ProductLocationCard';
import { SellerInfoCard } from '../../components/productDetail/SellerInfoCard';
import { SimilarAdsCarousel } from '../../components/productDetail/SimilarAdsCarousel';
import { ProductCategoriesAccordion } from '../../components/productDetail/ProductCategoriesAccordion';
import { ProductBottomActions } from '../../components/productDetail/ProductBottomActions';
import { PD_COLORS, pdStyles } from '../../components/productDetail/productDetailStyles';
import { useShareSheet } from '../../context/ShareSheetContext';
import { productToSharePayload } from '../../../utils/shareLinks';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, product: seedProduct } = route.params;
  const dispatch = useAppDispatch();
  const { openShare } = useShareSheet();
  const insets = useSafeAreaInsets();
  const { detail, loading, refreshing, onRefresh } = useProductDetail(productId, seedProduct);
  const { openProductChat, openingChat } = useProductChatInit();
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);

  const isLiked = localLiked ?? detail?.product.liked ?? false;
  const isSaved = localSaved ?? detail?.product.isSaved ?? false;

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleShare = useCallback(() => {
    if (!detail) {
      return;
    }
    openShare(productToSharePayload(detail.product, 'product'));
  }, [detail, openShare]);

  const handleLike = useCallback(() => {
    if (!detail) {
      return;
    }
    dispatch(likeProduct(detail.product.id));
    setLocalLiked(prev => !(prev ?? detail.product.liked));
  }, [detail, dispatch]);

  const handleSave = useCallback(() => {
    if (!detail) {
      return;
    }
    dispatch(saveProduct(detail.product.id));
    setLocalSaved(prev => !(prev ?? detail.product.isSaved));
  }, [detail, dispatch]);

  const openSimilar = useCallback(
    (id: string) => {
      navigation.push('ProductDetail', { productId: id });
    },
    [navigation],
  );

  const handleChat = useCallback(() => {
    if (!detail) {
      return;
    }
    openProductChat(detail);
  }, [detail, openProductChat]);

  const handleCall = useCallback(() => {
    const phone = detail?.contactPhone?.replace(/\s/g, '');
    if (!phone) {
      Alert.alert('Unavailable', 'Seller phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call failed', 'Unable to open the phone dialer.');
    });
  }, [detail?.contactPhone]);

  const handleWhatsApp = useCallback(() => {
    const phone = detail?.contactPhone?.replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('Unavailable', 'Seller WhatsApp number is not available.');
      return;
    }
    const url = `https://wa.me/${phone.replace(/^\+/, '')}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp failed', 'Unable to open WhatsApp.');
    });
  }, [detail?.contactPhone]);

  const contactOptions = detail?.contactOptions;
  const showCall = contactOptions?.call !== false;
  const showWhatsApp = contactOptions?.whatsapp === true;
  const showChat = contactOptions?.inAppChat !== false;

  const overlayTop = useMemo(() => Math.max(insets.top, 12), [insets.top]);

  const openImageGallery = useCallback(() => {
    if (!detail?.images.length) {
      return;
    }
    navigation.navigate('ProductImageGallery', {
      productId: detail.product.id,
      title: detail.product.title,
      images: detail.images,
      product: detail.product,
      isSaved,
    });
  }, [detail, isSaved, navigation]);

  if (loading && !detail) {
    return (
      <View style={[pdStyles.screen, styles.center]}>
        <ActivityIndicator size="large" color={PD_COLORS.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[pdStyles.screen, styles.center]}>
        <Text style={{ color: PD_COLORS.muted }}>Product not found</Text>
        <Pressable onPress={handleBack} style={{ marginTop: 12 }}>
          <Text style={{ color: PD_COLORS.primary, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={pdStyles.screen}>
      <Animated.View
        entering={FadeIn.duration(320)}
        style={StyleSheet.absoluteFill}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={pdStyles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PD_COLORS.primary}
            />
          }
        >
          <View style={styles.topView}>
            <ProductImageCarousel
              images={detail.images}
              onCounterPress={openImageGallery}
            />
            <View
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
            >
              <ProductHeaderCard detail={detail} />

              <View style={pdStyles.detail_section}>
                <ProductStatsRow
                  likesCount={detail.product.likesCount}
                  commentsCount={detail.commentsCount}
                  sharesCount={detail.sharesCount}
                  viewsCount={detail.viewsCount}
                  isLiked={isLiked}
                  isSaved={isSaved}
                  onLike={handleLike}
                  onSave={handleSave}
                />
              </View>
            </View>
          </View>

          {/*<View style={pdStyles.section}>
            <ProductStatsRow
              likesCount={detail.product.likesCount}
              commentsCount={detail.commentsCount}
              sharesCount={detail.sharesCount}
              viewsCount={detail.viewsCount}
              isLiked={isLiked}
              isSaved={isSaved}
              onLike={handleLike}
              onSave={handleSave}
            />
          </View>*/}

          {/*<View style={pdStyles.detail_section}>
            <ProductStatsRow
              likesCount={detail.product.likesCount}
              commentsCount={detail.commentsCount}
              sharesCount={detail.sharesCount}
              viewsCount={detail.viewsCount}
              isLiked={isLiked}
              isSaved={isSaved}
              onLike={handleLike}
              onSave={handleSave}
            />
          </View>*/}

          <View style={pdStyles.section}>
            <Text style={pdStyles.sectionTitle}>Overview</Text>
            <ProductOverviewGrid attributes={detail.productAttributes} />
          </View>

          <View style={pdStyles.section}>
            <ProductDescription
              title={detail.descriptionTitle}
              description={detail.description}
            />
          </View>

          {detail.showFeatureSection ? (
            <View style={pdStyles.section}>
              <Text style={pdStyles.sectionTitle}>Features</Text>
              <ProductFeaturesAccordion
                attributes={detail.productMultiAttributes}
              />
            </View>
          ) : null}

          <View style={pdStyles.section}>
            <ProductLocationCard
              title={detail.locationTitle}
              address={detail.locationAddress}
              latitude={detail.locationLatitude}
              longitude={detail.locationLongitude}
              onShowMap={() =>
                Alert.alert('Map', 'Map navigation will open here.')
              }
            />
          </View>

          <View style={pdStyles.section}>
            <SellerInfoCard
              seller={detail.seller}
              onViewAll={() =>
                Alert.alert('Seller', 'Seller listings will open here.')
              }
            />
          </View>

          {detail.similarAds.length > 0 ? (
            <View style={pdStyles.section}>
              <SimilarAdsCarousel
                items={detail.similarAds}
                onPressItem={openSimilar}
              />
            </View>
          ) : null}

          {/*{detail.categories.length > 0 ? (
            <View style={pdStyles.section}>
              <ProductCategoriesAccordion categories={detail.categories} />
            </View>
          ) : null}*/}
        </ScrollView>
      </Animated.View>

      <View
        style={[styles.topOverlay, { paddingTop: overlayTop }]}
        pointerEvents="box-none"
      >
        <Pressable style={pdStyles.floatingBtn} onPress={handleBack}>
          <Icon name="arrow-left" size={22} color="#111827" />
        </Pressable>
        {/*<View style={styles.topRight}>
          <Pressable style={pdStyles.floatingBtn} onPress={handleShare}>
            <Icon name="share-variant-outline" size={20} color="#111827" />
          </Pressable>
          <Pressable style={pdStyles.floatingBtn} onPress={handleLike}>
            <Icon
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#FF2D55' : '#111827'}
            />
          </Pressable>
        </View>*/}
      </View>

      <View style={styles.actions}>
        <ProductBottomActions
          showCall={showCall}
          showWhatsApp={showWhatsApp}
          showChat={showChat}
          onCall={showCall ? handleCall : undefined}
          onWhatsApp={showWhatsApp ? handleWhatsApp : undefined}
          onChat={showChat ? handleChat : undefined}
        />
        {openingChat ? (
          <View style={styles.chatLoader}>
            <ActivityIndicator size="small" color={PD_COLORS.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

//const hpSection = () => 12;

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  topRight: { flexDirection: 'row', gap: 10 },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
  },
  chatLoader: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 8,
  },
  topView: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8, // 40% of screen height
  },
});
