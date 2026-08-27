import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useProductDetail } from '../../hooks/useProductDetail';
import { Product } from '../../../domain/models/Product';
import { RootStackParamList } from '../../navigation/types';
import { ProductDescription } from '../productDetail/ProductDescription';
import { ProductFeaturesAccordion } from '../productDetail/ProductFeaturesAccordion';
import { ProductHeaderCard } from '../productDetail/ProductHeaderCard';
import { ProductImageCarousel as DetailImageCarousel } from '../productDetail/ProductImageCarousel';
import { ProductLocationCard } from '../productDetail/ProductLocationCard';
import { PD_COLORS, pdStyles } from '../productDetail/productDetailStyles';
import { SellerInfoCard } from '../productDetail/SellerInfoCard';
import { SimilarAdsCarousel } from '../productDetail/SimilarAdsCarousel';
import { ProductOverviewGrid } from '../productDetail/ProductOverviewGrid';
import { ProductImageCarousel } from './ProductImageCarousel';
import { ProductMetaInfo } from './ProductMetaInfo';
import { ProductSpecificationGrid } from './ProductSpecificationGrid';
import { ProductStatsRow } from './ProductStatsRow';
import { ProductQuickViewData } from './productQuickViewTypes';
import { qvStyles } from './productQuickViewStyles';

interface Props {
  quickViewData: ProductQuickViewData;
  onLike: (productId: string) => void;
  onSave: (productId: string) => void;
  onComment?: (product: Product) => void;
  onShare?: (product: Product) => void;
  onTitlePress?: () => void;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Sheet index crosses this while dragging between the collapsed (70%) and expanded (full
 * height) snap points. Below it the quick-view layer is the interactive/scrollable one; at or
 * above it the detail-like layer takes over.
 */
const EXPAND_THRESHOLD = 0.5;

/** Any upward drag past this starts prefetching the full detail payload, well before the
 * cross-fade finishes, so the detail-like layer is ready (not spinning) by the time it's
 * fully in front. Latches on — never resets while the sheet stays mounted. */
const PREFETCH_THRESHOLD = 0.05;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Cross-fades between the compact quick-view layout and the real product-detail-screen layout
 * (same components/styles as `ProductDetailScreen`) as the sheet is dragged from its 70% snap
 * point up to full height. Only the layer currently in front is a `BottomSheetScrollView` (so
 * it drives the sheet's pan-to-collapse gesture and can scroll on its own) — the hidden layer
 * behind it is a plain, non-interactive `View` snapshot.
 */
export const ProductQuickViewBody: React.FC<Props> = ({
  quickViewData,
  onLike,
  onSave,
  onComment,
  onShare,
  onTitlePress,
  navigation,
}) => {
  const { animatedIndex } = useBottomSheet();
  const { product: activeProduct } = quickViewData;
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadDetail, setShouldLoadDetail] = useState(false);

  useAnimatedReaction(
    () => animatedIndex.value >= EXPAND_THRESHOLD,
    (expanded, previouslyExpanded) => {
      if (expanded !== previouslyExpanded) {
        runOnJS(setIsExpanded)(expanded);
      }
    },
    [],
  );

  useAnimatedReaction(
    () => animatedIndex.value >= PREFETCH_THRESHOLD,
    shouldLoad => {
      if (shouldLoad) {
        runOnJS(setShouldLoadDetail)(true);
      }
    },
    [],
  );

  const { detail } = useProductDetail(
    shouldLoadDetail ? activeProduct.id : '',
    activeProduct,
  );

  const quickViewLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    pointerEvents: animatedIndex.value < EXPAND_THRESHOLD ? 'auto' : 'none',
  }));

  const detailLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    pointerEvents: animatedIndex.value >= EXPAND_THRESHOLD ? 'auto' : 'none',
  }));

  const quickViewContent = (
    <>
      <ProductImageCarousel images={quickViewData.images} />
      <ProductStatsRow
        likesCount={activeProduct.likesCount}
        commentsCount={activeProduct.commentCount ?? 0}
        sharesCount={activeProduct.commentCount ?? 0}
        viewsCount={activeProduct.views ?? 0}
        isLiked={activeProduct.liked}
        isSaved={activeProduct.isSaved}
        onLike={() => onLike(activeProduct.id)}
        onSave={() => onSave(activeProduct.id)}
        onComment={onComment ? () => onComment(activeProduct) : undefined}
        onShare={onShare ? () => onShare(activeProduct) : undefined}
      />
      <ProductMetaInfo data={quickViewData} onTitlePress={onTitlePress} />
      <ProductSpecificationGrid data={quickViewData} />
    </>
  );

  const detailContent = detail ? (
    <>
      <View style={detailStyles.topView}>
        <DetailImageCarousel images={detail.images} />
        <View style={detailStyles.topViewOverlay}>
          <ProductHeaderCard detail={detail} />
          <View style={pdStyles.detail_section}>
            <ProductStatsRow
              likesCount={activeProduct.likesCount}
              commentsCount={detail.commentsCount}
              sharesCount={detail.sharesCount}
              viewsCount={detail.viewsCount}
              isLiked={activeProduct.liked}
              isSaved={activeProduct.isSaved}
              onLike={() => onLike(activeProduct.id)}
              onSave={() => onSave(activeProduct.id)}
              onComment={onComment ? () => onComment(activeProduct) : undefined}
              onShare={onShare ? () => onShare(activeProduct) : undefined}
            />
          </View>
        </View>
      </View>

      {detail.productAttributes.length > 0 ? (
        <View style={pdStyles.section}>
          <Text style={pdStyles.sectionTitle}>Overview</Text>
          <ProductOverviewGrid attributes={detail.productAttributes} />
        </View>
      ) : null}

      <View style={pdStyles.section}>
        <ProductDescription title={detail.descriptionTitle} description={detail.description} />
      </View>

      {detail.showFeatureSection ? (
        <View style={pdStyles.section}>
          <Text style={pdStyles.sectionTitle}>Features</Text>
          <ProductFeaturesAccordion attributes={detail.productMultiAttributes} />
        </View>
      ) : null}

      <View style={pdStyles.section}>
        <ProductLocationCard
          title={detail.locationTitle}
          address={detail.locationAddress}
          latitude={detail.locationLatitude}
          longitude={detail.locationLongitude}
          onShowMap={() => Alert.alert('Map', 'Map navigation will open here.')}
        />
      </View>

      <View style={pdStyles.section}>
        <SellerInfoCard
          seller={detail.seller}
          onViewAll={() => Alert.alert('Seller', 'Seller listings will open here.')}
          onPressSeller={sellerId => navigation?.navigate('OtherProfile', { userId: sellerId })}
        />
      </View>

      {detail.similarAds.length > 0 ? (
        <View style={pdStyles.section}>
          <SimilarAdsCarousel
            items={detail.similarAds}
            onPressItem={id => navigation?.push('ProductDetail', { productId: id })}
          />
        </View>
      ) : null}
    </>
  ) : (
    <View style={detailStyles.loading}>
      <ActivityIndicator size="large" color={PD_COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.body}>
      <Animated.View style={[StyleSheet.absoluteFill, quickViewLayerStyle]}>
        {isExpanded ? (
          <View style={qvStyles.scrollContent}>{quickViewContent}</View>
        ) : (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={qvStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'android'}
          >
            {quickViewContent}
          </BottomSheetScrollView>
        )}
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, detailLayerStyle]}>
        {isExpanded ? (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={pdStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'android'}
          >
            {detailContent}
          </BottomSheetScrollView>
        ) : (
          <View style={pdStyles.scrollContent}>{detailContent}</View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});

const detailStyles = StyleSheet.create({
  topView: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.55,
  },
  topViewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  loading: {
    minHeight: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
