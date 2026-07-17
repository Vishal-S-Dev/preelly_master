import { ProductApi } from '../data/api/ProductApi';

/** Session-level guards so we never spam `/view` for the same product. */
const inFlightViews = new Set<string>();
const completedViews = new Set<string>();

const VIEW_WATCH_THRESHOLD = 0.7;

export const PRODUCT_VIEW_WATCH_THRESHOLD = VIEW_WATCH_THRESHOLD;

export const shouldSkipProductView = (
  productId: string,
  isViewed?: boolean,
): boolean => {
  if (!productId) {
    return true;
  }
  if (isViewed === true) {
    return true;
  }
  if (completedViews.has(productId) || inFlightViews.has(productId)) {
    return true;
  }
  return false;
};

/**
 * Silently POST `/api/products/:id/view` once the user qualifies.
 * Never throws / never alerts — safe to fire from playback progress.
 */
export const recordProductViewSilently = async (
  productId: string,
  options?: { isViewed?: boolean },
): Promise<boolean> => {
  if (shouldSkipProductView(productId, options?.isViewed)) {
    return false;
  }

  inFlightViews.add(productId);
  try {
    await ProductApi.viewProduct(productId);
    completedViews.add(productId);
    return true;
  } catch {
    // Silent by design — allow a later retry if the request failed.
    return false;
  } finally {
    inFlightViews.delete(productId);
  }
};

/** Marks a product as viewed locally (e.g. after a successful API call). */
export const markProductViewCompletedLocally = (productId: string): void => {
  if (productId) {
    completedViews.add(productId);
  }
};
