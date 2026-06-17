import { ShareContentType, SharePayload } from '../types/share.types';
import { Product } from '../domain/models/Product';

const WEB_BASE = 'https://preelly.app';

export const buildDeepLink = (contentType: ShareContentType, contentId: string): string =>
  `app://${contentType}/${contentId}`;

export const buildWebShareUrl = (contentType: ShareContentType, contentId: string): string =>
  `${WEB_BASE}/${contentType}/${contentId}`;

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
