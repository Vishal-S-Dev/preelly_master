import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { AppText } from '../../components/common/AppText';
import { ProductGalleryGrid } from '../../components/productDetail/ProductGalleryGrid';
import { PD_COLORS } from '../../components/productDetail/productDetailStyles';
import { useAppDispatch } from '../../hooks/useRedux';
import { saveProduct } from '../../redux/slices/productSlice';
import { useShareSheet } from '../../context/ShareSheetContext';
import { productToSharePayload } from '../../../utils/shareLinks';
import { filterRenderableImageUris } from '../../../utils/createPostImageUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductImageGallery'>;

export const ProductImageGalleryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, title, images, product, isSaved: initialSaved } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { openShare } = useShareSheet();
  const [isSaved, setIsSaved] = useState(initialSaved ?? product?.isSaved ?? false);

  const galleryImages = useMemo(() => filterRenderableImageUris(images), [images]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleShare = useCallback(() => {
    if (!product) {
      return;
    }
    openShare(productToSharePayload(product, 'product'));
  }, [openShare, product]);

  const handleSave = useCallback(() => {
    dispatch(saveProduct(productId));
    setIsSaved(prev => !prev);
  }, [dispatch, productId]);

  const openViewer = useCallback(
    (initialIndex: number) => {
      navigation.navigate('ProductImageViewer', {
        images: galleryImages,
        initialIndex,
      });
    },
    [galleryImages, navigation],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={styles.headerBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={24} color={PD_COLORS.text} />
        </Pressable>
        <AppText weight="600" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </AppText>
        <View style={styles.headerActions}>
          {product ? (
            <Pressable
              style={styles.headerBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share listing"
            >
              <Icon name="share-variant-outline" size={22} color={PD_COLORS.text} />
            </Pressable>
          ) : (
            <View style={styles.headerBtnPlaceholder} />
          )}
          <Pressable
            style={styles.headerBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Bookmark listing'}
          >
            <Icon
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? PD_COLORS.primary : PD_COLORS.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProductGalleryGrid images={galleryImages} onPressImage={openViewer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: PD_COLORS.text,
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
