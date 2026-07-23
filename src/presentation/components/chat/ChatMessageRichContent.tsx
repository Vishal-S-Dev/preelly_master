import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductApi } from '../../../data/api/ProductApi';
import { ProductDTO } from '../../../data/dto/ProductDTO';
import { RootStackParamList } from '../../navigation/types';
import {
  extractProductIdFromMessage,
  messageUsesReelLink,
  stripProductUrls,
} from '../../../utils/chatMessageUtils';
import { resolveListingOwnerId } from '../../../utils/reelShareUtils';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';

type BubbleVariant = 'incoming' | 'outgoing';

interface Props {
  text: string;
  variant: BubbleVariant;
}

export const ChatMessageRichContent: React.FC<Props> = ({ text, variant }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const productId = useMemo(() => extractProductIdFromMessage(text), [text]);
  const openAsReel = useMemo(
    () => messageUsesReelLink(text, productId),
    [text, productId],
  );
  const caption = useMemo(
    () => (productId ? stripProductUrls(text, productId) : text?.trim() || ''),
    [text, productId],
  );

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setProduct(null);
    ProductApi.getProductById(productId)
      .then(data => {
        if (!cancelled) {
          setProduct(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleOpenListing = useCallback(() => {
    if (!productId) {
      return;
    }
    if (openAsReel) {
      const ownerId = resolveListingOwnerId(product);
      if (ownerId) {
        navigation.navigate('UserFeed', {
          userId: ownerId,
          initialProductId: productId,
          initialIndex: 0,
        });
        return;
      }
    }
    navigation.navigate('ProductDetail', { productId });
  }, [navigation, openAsReel, product, productId]);

  const captionColor = variant === 'outgoing' ? THREAD_UI.outgoingText : THREAD_UI.incomingText;

  if (!productId) {
    return <Text style={[styles.plainText, { color: captionColor }]}>{text}</Text>;
  }

  const thumb = product?.video
    ? ProductApi.withBase(product.video)
    : product?.images?.[0]
      ? ProductApi.withBase(product.images[0])
      : null;

  const priceLabel =
    product?.price != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: product.currency || 'AED',
          minimumFractionDigits: 0,
        }).format(product.price)
      : null;

  return (
    <View>
      {caption ? (
        <Text style={[styles.caption, { color: captionColor }]}>{caption}</Text>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.productCard, pressed && styles.productCardPressed]}
        onPress={handleOpenListing}
        accessibilityRole="button"
        accessibilityLabel={openAsReel ? 'Open shared reel' : 'Open listing'}>
        {loading ? (
          <View style={styles.cardLoading}>
            <ActivityIndicator color={THREAD_UI.primary} />
          </View>
        ) : failed || !product ? (
          <View style={styles.cardFallback}>
            <Icon name="play-circle-outline" size={22} color={THREAD_UI.textMuted} />
            <Text style={styles.cardFallbackText}>
              {openAsReel ? 'Reel · Tap to watch' : 'Listing · Open product'}
            </Text>
          </View>
        ) : openAsReel ? (
          <View style={styles.reelRow}>
            <View style={styles.reelThumbWrap}>
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.reelThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.reelThumb, styles.reelThumbPlaceholder]}>
                  <Icon name="play" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.reelPlayBadge}>
                <Icon name="play" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.reelMeta}>
              <Text style={styles.reelTitle} numberOfLines={2}>
                {product.title || 'Reel'}
              </Text>
              {priceLabel ? <Text style={styles.reelPrice}>{priceLabel}</Text> : null}
              <Text style={styles.reelHint}>Tap to watch reel</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardImageWrap}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
            )}
            <View style={styles.cardOverlayTop}>
              <Text style={styles.overlayTitle} numberOfLines={2}>
                {product.title || 'Product'}
              </Text>
            </View>
            {priceLabel ? (
              <View style={styles.cardOverlayBottom}>
                <Text style={styles.overlayPrice}>{priceLabel}</Text>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  plainText: {
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
    maxWidth: 280,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  productCardPressed: {
    opacity: 0.92,
  },
  cardLoading: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#F9FAFB',
  },
  cardFallbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: THREAD_UI.textMuted,
  },
  reelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  reelThumbWrap: {
    position: 'relative',
  },
  reelThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  reelThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  reelPlayBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelMeta: {
    flex: 1,
    minWidth: 0,
  },
  reelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  reelPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: THREAD_UI.primary,
  },
  reelHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: THREAD_UI.textMuted,
  },
  cardImageWrap: {
    height: 220,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    backgroundColor: '#D1D5DB',
  },
  cardOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopLeftRadius: 12,
  },
  overlayPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
