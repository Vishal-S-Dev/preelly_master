import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductDetailView } from '../../types/product.types';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from './useRedux';
import { createOrGetProductChat } from '../redux/slices/chatSlice';

const resolveSellerId = (detail: ProductDetailView): string | null => {
  const fromSeller = detail.seller?.id?.trim();
  if (fromSeller && fromSeller !== 'seller_1') {
    return fromSeller;
  }
  const fromProductSeller = detail.product.seller?.id?.trim();
  if (fromProductSeller) {
    return fromProductSeller;
  }
  return fromSeller || null;
};

export const useProductChatInit = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openingChat, setOpeningChat] = useState(false);

  const openProductChat = useCallback(
    async (detail: ProductDetailView) => {
      if (openingChat) {
        return;
      }

      const productId = detail.product.id;
      const sellerId = resolveSellerId(detail);

      if (!productId) {
        Alert.alert('Chat unavailable', 'Product information is missing for this listing.');
        return;
      }
      if (!sellerId) {
        Alert.alert('Chat unavailable', 'Seller information is missing for this listing.');
        return;
      }

      setOpeningChat(true);
      try {
        const { thread } = await dispatch(
          createOrGetProductChat({ productId, sellerId }),
        ).unwrap();
        navigation.navigate('ChatThread', { threadId: thread.id });
      } catch (error) {
        const message =
          typeof error === 'string' ? error : 'Could not open chat. Please try again.';
        Alert.alert('Chat unavailable', message);
      } finally {
        setOpeningChat(false);
      }
    },
    [dispatch, navigation, openingChat],
  );

  return { openProductChat, openingChat };
};
