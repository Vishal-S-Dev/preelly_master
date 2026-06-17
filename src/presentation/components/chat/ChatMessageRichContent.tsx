import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProductApi } from '../../../data/api/ProductApi';
import { ProductDTO } from '../../../data/dto/ProductDTO';
import { extractProductIdFromMessage, stripProductUrls } from '../../../utils/chatMessageUtils';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';

type BubbleVariant = 'incoming' | 'outgoing';

interface Props {
  text: string;
  variant: BubbleVariant;
}

export const ChatMessageRichContent: React.FC<Props> = ({ text, variant }) => {
  const productId = useMemo(() => extractProductIdFromMessage(text), [text]);
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
      <Pressable style={styles.productCard}>
        {loading ? (
          <View style={styles.cardLoading}>
            <ActivityIndicator color={THREAD_UI.primary} />
          </View>
        ) : failed || !product ? (
          <View style={styles.cardFallback}>
            <Text style={styles.cardFallbackText}>Listing · Open product</Text>
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
    maxWidth: 260,
  },
  cardLoading: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EAF6',
  },
  cardFallback: {
    height: 120,
    padding: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
  },
  cardFallbackText: {
    fontSize: 14,
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
