const PRODUCT_URL_RE = /\/products\/([a-f0-9]{24})\b/i;

export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/** Same regex as olx `extractProductIdFromMessage`. */
export function extractProductIdFromMessage(text?: string | null): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  const match = text.match(PRODUCT_URL_RE);
  return match && isValidObjectId(match[1]) ? match[1] : null;
}

export function stripProductUrls(raw: string, productId: string): string {
  if (!raw || !productId) {
    return '';
  }
  const esc = productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlPattern = new RegExp(`https?:\\/\\/[^\\s]*\\/products\\/${esc}[^\\s]*`, 'gi');
  const pathPattern = new RegExp(`\\/products\\/${esc}[^\\s]*`, 'gi');
  return raw
    .replace(urlPattern, '')
    .replace(pathPattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
