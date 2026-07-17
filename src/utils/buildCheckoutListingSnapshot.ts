import { CreatePostDraft } from '../types/createPost.types';
import { CheckoutListingSnapshot } from '../types/checkout.types';
import { formatAed } from './checkoutTotals';

const dig = (fields: Record<string, string>, ...keys: string[]): string => {
  for (const key of keys) {
    const direct = fields[key]?.trim();
    if (direct) {
      return direct;
    }
    const found = Object.entries(fields).find(
      ([k]) => k.toLowerCase() === key.toLowerCase(),
    );
    if (found?.[1]?.trim()) {
      return found[1].trim();
    }
  }
  return '';
};

const formatMileage = (raw?: string): string | undefined => {
  if (!raw?.trim()) {
    return undefined;
  }
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) {
    return raw.trim();
  }
  return `${Number(digits).toLocaleString('en-US')} km`;
};

export const buildCheckoutListingSnapshot = (
  draft: CreatePostDraft,
  productId?: string,
  priceValue?: number,
): CheckoutListingSnapshot => {
  const fields = draft.dynamicFields ?? {};
  const year =
    dig(fields, 'year', 'Year', 'modelYear') ||
    (draft.extractedData?.year != null ? String(draft.extractedData.year) : '');
  const mileageRaw =
    dig(fields, 'mileage', 'kilometers', 'km', 'odometer') ||
    (draft.extractedData?.mileage != null
      ? String(draft.extractedData.mileage)
      : '');
  const amount =
    typeof priceValue === 'number' && Number.isFinite(priceValue)
      ? priceValue
      : Number(String(draft.price ?? '').replace(/[^\d.]/g, '')) || 0;

  return {
    productId,
    title: draft.title?.trim() || 'Your listing',
    categoryName: draft.subcategoryName || draft.categoryName || 'Listing',
    imageUrl: draft.images?.[0]?.uri,
    year: year || undefined,
    mileage: formatMileage(mileageRaw),
    priceValue: amount,
    priceLabel: formatAed(amount, amount % 1 === 0 ? 0 : 2),
  };
};
