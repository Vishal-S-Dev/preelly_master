import React, { forwardRef, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  BottomSheetFooterProps,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Product } from '../../../domain/models/Product';
import { mapProductToQuickView } from './mapProductToQuickView';
// import { ProductBottomActions } from './ProductBottomActions';
import { ChatWithSellerButton } from './ChatWithSellerButton';
import { ProductImageCarousel } from './ProductImageCarousel';
import { ProductMetaInfo } from './ProductMetaInfo';
import { ProductSpecificationGrid } from './ProductSpecificationGrid';
import { ProductStatsRow } from './ProductStatsRow';
import { QV_COLORS, qvStyles } from './productQuickViewStyles';

export interface ProductQuickViewSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  product: Product | null;
  onDismiss?: () => void;
  onLike: (productId: string) => void;
  onSave: (productId: string) => void;
  onOpenDetail?: (product: Product) => void;
  onChat?: (product: Product) => void;
  chatLoading?: boolean;
}

export const ProductQuickViewSheet = forwardRef<BottomSheetModal, Props>(
  ({ product, onDismiss, onLike, onSave, onOpenDetail, onChat, chatLoading }, ref) => {
    //const snapPoints = useMemo(() => ['70%', '94%'], []);
    const snapPoints = useMemo(() => ['70%'], []);
    const quickViewData = useMemo(
      () => (product ? mapProductToQuickView(product) : null),
      [product],
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.55}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleChatPress = useCallback(() => {
      if (!product || !onChat) {
        return;
      }
      onChat(product);
    }, [onChat, product]);

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        if (!onChat) {
          return null;
        }

        return (
          <BottomSheetFooter {...props}>
            <View style={styles.footerContainer}>
              {/* Previous multi-action footer kept for reference / easy rollback:
              <ProductBottomActions
                onCall={...}
                onWhatsApp={...}
                onChat={...}
              />
              */}
              <ChatWithSellerButton
                onPress={handleChatPress}
                loading={chatLoading}
                includeSafeArea={false}
              />
            </View>
          </BottomSheetFooter>
        );
      },
      [chatLoading, handleChatPress, onChat],
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index < 0) {
          onDismiss?.();
        }
      },
      [onDismiss],
    );

    const handleTitlePress = useCallback(() => {
      if (!onOpenDetail || !product) {
        return;
      }
      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss();
      }
      onOpenDetail(product);
    }, [onOpenDetail, product, ref]);

    if (!quickViewData) {
      return (
        <BottomSheetModal
          ref={ref}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          activeOffsetY={[-12, 12]}
          activeOffsetX={[-9999, 9999]}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleComponent={null}
          onChange={handleSheetChange}>
          <View />
        </BottomSheetModal>
      );
    }

    const { product: activeProduct } = quickViewData;

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        activeOffsetY={[-12, 12]}
        activeOffsetX={[-9999, 9999]}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        footerComponent={renderFooter}
        handleComponent={null}
        onChange={handleSheetChange}
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.sheetContainer}>
          <View style={qvStyles.handleWrap}>
            <View style={qvStyles.handle} />
          </View>

          <ProductImageCarousel images={quickViewData.images} />

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={qvStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'android'}
          >
            <ProductStatsRow
              likesCount={activeProduct.likesCount}
              commentsCount={activeProduct.commentCount ?? 0}
              sharesCount={activeProduct.commentCount ?? 0}
              viewsCount={activeProduct.views ?? 0}
              isLiked={activeProduct.liked}
              isSaved={activeProduct.isSaved}
              onLike={() => onLike(activeProduct.id)}
              onSave={() => onSave(activeProduct.id)}
            />

            <ProductMetaInfo
              data={quickViewData}
              onTitlePress={onOpenDetail ? handleTitlePress : undefined}
            />
            <ProductSpecificationGrid data={quickViewData} />
          </BottomSheetScrollView>

          {/*<ProductBottomActions />*/}
        </View>
      </BottomSheetModal>
    );
  },
);

ProductQuickViewSheet.displayName = 'ProductQuickViewSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: QV_COLORS.sheetBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContainer: {
    flex: 1,
    minHeight: hp('50%'),
  },
  footerContainer: {
    backgroundColor: QV_COLORS.sheetBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    // Soft top edge so the CTA sits flush with sheet content
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
});
