import React, { forwardRef, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  BottomSheetFooterProps,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Product } from '../../../domain/models/Product';
import { RootStackParamList } from '../../navigation/types';
import { mapProductToQuickView } from './mapProductToQuickView';
// import { ProductBottomActions } from './ProductBottomActions';
import { ChatWithSellerButton } from './ChatWithSellerButton';
import { ProductQuickViewBody } from './ProductQuickViewBody';
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
  onComment?: (product: Product) => void;
  onShare?: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
  onChat?: (product: Product) => void;
  chatLoading?: boolean;
  /** Used by the expanded detail-like layer to open a seller's profile or a similar ad. */
  navigation?: NativeStackNavigationProp<RootStackParamList>;
}

export const ProductQuickViewSheet = forwardRef<BottomSheetModal, Props>(
  (
    {
      product,
      onDismiss,
      onLike,
      onSave,
      onComment,
      onShare,
      onOpenDetail,
      onChat,
      chatLoading,
      navigation,
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    // Dragging the handle from the 70% snap point up to the second, full-height snap point is
    // what drives the quick-view → detail-like cross-fade in ProductQuickViewBody.
    const snapPoints = useMemo(() => ['70%', '100%'], []);
    const quickViewData = useMemo(
      () => (product ? mapProductToQuickView(product) : null),
      [product],
    );
    const showChatButton = Boolean(product && !product.isSold && onChat);

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
      if (ref && typeof ref !== 'function') {
        ref.current?.dismiss();
      }
      onChat(product);
    }, [onChat, product, ref]);

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        if (!showChatButton) {
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
      [chatLoading, handleChatPress, showChatButton],
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
          topInset={insets.top}
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

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enablePanDownToClose
        enableDynamicSizing={false}
        activeOffsetY={[-12, 12]}
        activeOffsetX={[-9999, 9999]}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        footerComponent={showChatButton ? renderFooter : undefined}
        handleComponent={null}
        onChange={handleSheetChange}
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.sheetContainer}>
          <View style={qvStyles.handleWrap}>
            <View style={qvStyles.handle} />
          </View>

          <ProductQuickViewBody
            quickViewData={quickViewData}
            onLike={onLike}
            onSave={onSave}
            onComment={onComment}
            onShare={onShare}
            onTitlePress={onOpenDetail ? handleTitlePress : undefined}
            navigation={navigation}
          />
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
