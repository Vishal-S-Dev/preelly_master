import { ProductDTO } from '../data/dto/ProductDTO';
import { Product } from '../domain/models/Product';
import { SharePayload } from '../types/share.types';

export const REEL_URL_RE = /\/reels\?reel=([a-f0-9]{24})\b/i;
export const REEL_DEEP_LINK_RE = /app:\/\/reel\/([a-f0-9]{24})\b/i;

export const buildReelShareUrl = (productId: string, origin = 'https://preelly.app'): string =>
  `${origin}/reels?reel=${encodeURIComponent(productId)}`;

export const formatReelPrice = (product?: Product | ProductDTO | null): string => {
  const price =
    product && 'productPriceValue' in product
      ? product.productPriceValue ?? product.price
      : product && 'price' in product
        ? product.price
        : null;
  if (price == null) {
    return '';
  }
  const currency =
    typeof product?.currency === 'string' && product.currency.length === 3
      ? product.currency.toUpperCase()
      : 'AED';
  return `${currency} ${Number(price).toLocaleString('en-US')}`;
};

export const buildReelShareText = (
  product: Pick<Product, 'id' | 'title' | 'price' | 'currency'> | ProductDTO | null | undefined,
  message = '',
): string => {
  const productId = product && 'id' in product ? product.id : product?._id ?? product?.id;
  const title = product?.title || 'this reel';
  const price = formatReelPrice(product ?? null);
  const reelUrl = buildReelShareUrl(String(productId ?? ''));
  const lines = [message.trim() || `Check out ${title} on Preelly`, price, reelUrl].filter(Boolean);
  return lines.join('\n');
};

export const extractReelIdFromMessage = (text?: string | null): string | null => {
  if (!text) {
    return null;
  }
  const reelMatch = REEL_URL_RE.exec(text) ?? REEL_DEEP_LINK_RE.exec(text);
  return reelMatch?.[1] ?? null;
};

export const messageUsesReelLink = (text?: string | null, productId?: string | null): boolean => {
  if (!text || !productId) {
    return false;
  }
  return (REEL_URL_RE.test(text) || REEL_DEEP_LINK_RE.test(text)) && text.includes(productId);
};

export const buildReelSharePayloadMessage = (
  payload: SharePayload,
  messageNote?: string,
): string => {
  const pseudoProduct = {
    id: payload.contentId,
    title: payload.title,
    price: Number(String(payload.subtitle ?? '').replace(/[^\d.]/g, '')) || undefined,
    currency: 'AED',
  };
  return buildReelShareText(pseudoProduct, messageNote ?? '');
};

/** Reel-share DMs use `seller` as the peer (recipient), not the listing owner. */
export const isReelShareThread = (
  sellerId?: string | null,
  listingOwnerId?: string | null,
): boolean => {
  if (!sellerId || !listingOwnerId) {
    return false;
  }
  return sellerId !== listingOwnerId;
};

export const resolveListingOwnerId = (
  product?: ProductDTO | null,
): string | null => {
  if (!product) {
    return null;
  }
  const sellerRef = product.seller as { _id?: string; id?: string } | string | undefined;
  if (typeof sellerRef === 'string') {
    return sellerRef;
  }
  if (sellerRef?._id || sellerRef?.id) {
    return String(sellerRef._id ?? sellerRef.id);
  }
  const userRef = product.user as { _id?: string; id?: string } | string | undefined;
  if (typeof userRef === 'string') {
    return userRef;
  }
  return userRef?._id || userRef?.id ? String(userRef._id ?? userRef.id) : null;
};
