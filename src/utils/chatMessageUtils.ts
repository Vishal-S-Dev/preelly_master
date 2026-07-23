import {
  extractReelIdFromMessage,
  REEL_DEEP_LINK_RE,
  REEL_URL_RE,
} from './reelShareUtils';

const PRODUCT_URL_RE = /\/products\/([a-f0-9]{24})\b/i;

export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/** Extract product/reel id from shared chat message text (web + mobile formats). */
export function extractProductIdFromMessage(text?: string | null): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  const reelId = extractReelIdFromMessage(text);
  if (reelId && isValidObjectId(reelId)) {
    return reelId;
  }
  const match = text.match(PRODUCT_URL_RE);
  return match && isValidObjectId(match[1]) ? match[1] : null;
}

export function messageUsesReelLink(text?: string | null, productId?: string | null): boolean {
  if (!text || !productId) {
    return false;
  }
  return (REEL_URL_RE.test(text) || REEL_DEEP_LINK_RE.test(text)) && text.includes(productId);
}

export function stripProductUrls(raw: string, productId: string): string {
  if (!raw || !productId) {
    return '';
  }
  const esc = productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reelPattern = new RegExp(`https?:\\/\\/[^\\s]*\\/reels\\?reel=${esc}[^\\s]*`, 'gi');
  const urlPattern = new RegExp(`https?:\\/\\/[^\\s]*\\/products\\/${esc}[^\\s]*`, 'gi');
  const pathPattern = new RegExp(`\\/products\\/${esc}[^\\s]*`, 'gi');
  const reelPathPattern = new RegExp(`\\/reels\\?reel=${esc}[^\\s]*`, 'gi');
  const deepLinkPattern = new RegExp(`app:\\/\\/reel\\/${esc}\\b`, 'gi');
  return raw
    .replace(reelPattern, '')
    .replace(urlPattern, '')
    .replace(pathPattern, '')
    .replace(reelPathPattern, '')
    .replace(deepLinkPattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
