import { ShareContentType, SharePayload } from '../types/share.types';
import { Product } from '../domain/models/Product';
import {
  buildReelShareText,
  buildReelShareUrl,
  extractReelIdFromMessage,
  REEL_DEEP_LINK_RE,
  REEL_URL_RE,
} from './reelShareUtils';

const WEB_BASE = 'https://preelly.app';

export const buildDeepLink = (contentType: ShareContentType, contentId: string): string =>
  `app://${contentType}/${contentId}`;

export const buildWebShareUrl = (contentType: ShareContentType, contentId: string): string => {
  if (contentType === 'reel') {
    return buildReelShareUrl(contentId, WEB_BASE);
  }
  return `${WEB_BASE}/${contentType}/${contentId}`;
};

export const productToSharePayload = (product: Product, contentType: ShareContentType = 'reel'): SharePayload => {
  const deepLink = buildDeepLink(contentType, product.id);
  return {
    contentId: product.id,
    contentType,
    title: product.title,
    subtitle: `${product.currency} ${product.price.toLocaleString()}`,
    thumbnail: product.imageUrl || product.videoUrl,
    deepLink,
    productId: product.id,
    sellerId: product.seller?.id,
  };
};

export const buildShareMessage = (payload: SharePayload, userMessage?: string): string => {
  if (payload.contentType === 'reel') {
    return buildReelShareText(
      {
        id: payload.contentId,
        title: payload.title,
        price: Number(String(payload.subtitle ?? '').replace(/[^\d.]/g, '')) || undefined,
        currency: 'AED',
      },
      userMessage,
    );
  }

  const lines = [
    payload.title,
    payload.subtitle,
    `Check this out on Preelly: ${buildWebShareUrl(payload.contentType, payload.contentId)}`,
    payload.deepLink,
  ].filter(Boolean);
  if (userMessage?.trim()) {
    lines.unshift(userMessage.trim());
  }
  return lines.join('\n');
};

export { extractReelIdFromMessage, REEL_URL_RE, REEL_DEEP_LINK_RE };
