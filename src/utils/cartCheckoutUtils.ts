import {
  CartCheckoutServiceRow,
  CartCheckoutTotals,
  CartItem,
  CartPopulatedProduct,
  CheckoutService,
  PickDropInfo,
} from '../types/cartCheckout.types';
import {
  PAY_VIA_PREELLY_FEE,
  PICK_DROP_FEE,
  VAT_PERCENT,
} from '../constants/cartCheckoutConstants';
import { roundMoney } from './checkoutTotals';

export const kindOfCheckoutService = (svc: CheckoutService | null | undefined): 'preelly' | 'pickdrop' | 'simple' => {
  const name = svc?.serviceName?.toLowerCase() || '';
  if (name.includes('preelly')) {
    return 'preelly';
  }
  if (name.includes('pick') && name.includes('drop')) {
    return 'pickdrop';
  }
  return 'simple';
};

export const serviceHighlights = (
  svc: CheckoutService | null | undefined,
  fallback: readonly string[],
): string[] => {
  const list = (svc?.highlights || [])
    .map(item => (typeof item === 'string' ? item : item?.highlight))
    .filter(Boolean) as string[];
  return list.length ? list : [...fallback];
};

export const resolveCartProduct = (
  productId: CartItem['productId'],
): CartPopulatedProduct | null => {
  if (!productId || typeof productId === 'string') {
    return null;
  }
  return productId;
};

export const resolveCartProductId = (item: CartItem | null | undefined): string => {
  const productId = item?.productId;
  if (!productId) {
    return '';
  }
  if (typeof productId === 'string') {
    return productId;
  }
  return String(productId._id ?? productId.id ?? '');
};

export const resolveListingPrice = (item: CartItem | null, product: CartPopulatedProduct | null): number => {
  const fromItem = Number(item?.unitPrice ?? 0);
  if (fromItem > 0) {
    return fromItem;
  }
  return Number(product?.productPrice ?? product?.price ?? 0);
};

export const resolveCategoryLabel = (product: CartPopulatedProduct | null): string => {
  if (!product) {
    return '';
  }
  if (product.subcategory && typeof product.subcategory === 'object') {
    return product.subcategory.name ?? '';
  }
  if (typeof product.subcategory === 'string' && product.subcategory.trim()) {
    return product.subcategory;
  }
  return product.category?.name || product.condition || '';
};

export const flattenProductConditions = (product: CartPopulatedProduct | null): string[] => {
  const groups = Array.isArray(product?.features) ? product.features : [];
  const values = groups.flatMap(group => (Array.isArray(group?.values) ? group.values : []));
  return [...new Set(values.map(value => String(value).trim()).filter(Boolean))];
};

export interface ComputeCartCheckoutTotalsInput {
  listingPrice: number;
  selectedServiceRows: CartCheckoutServiceRow[];
  discountAmount?: number;
  vatPercent?: number;
}

export const computeCartCheckoutTotals = ({
  listingPrice,
  selectedServiceRows,
  discountAmount = 0,
  vatPercent = VAT_PERCENT,
}: ComputeCartCheckoutTotalsInput): CartCheckoutTotals => {
  const productFee = roundMoney(listingPrice);
  const addonsTotal = roundMoney(
    selectedServiceRows.reduce((sum, row) => sum + row.fee, 0),
  );
  const base = roundMoney(productFee + addonsTotal);
  const cappedDiscount = Math.min(roundMoney(discountAmount), addonsTotal);
  const taxableBase = roundMoney(base - cappedDiscount);
  const vatValue = roundMoney((taxableBase * vatPercent) / 100);

  return {
    productFee,
    addonsTotal,
    base,
    discountAmount: cappedDiscount,
    vatValue,
    total: roundMoney(taxableBase + vatValue),
  };
};

export interface ServiceSelectionState {
  payPreelly: boolean;
  pickDrop: boolean;
  simpleSelected: Set<string>;
  pickDropInfo: PickDropInfo | null;
  preellyService: CheckoutService | null;
  pickDropService: CheckoutService | null;
}

export const buildSelectedServiceRows = (
  services: CheckoutService[],
  state: ServiceSelectionState,
): CartCheckoutServiceRow[] => {
  const payPreellyFee = Number(state.preellyService?.price ?? PAY_VIA_PREELLY_FEE);
  const pickDropFixCost = Number(state.pickDropService?.price ?? PICK_DROP_FEE);

  return services
    .filter(svc => {
      const kind = kindOfCheckoutService(svc);
      if (kind === 'preelly') {
        return state.payPreelly;
      }
      if (kind === 'pickdrop') {
        return state.pickDrop;
      }
      return state.simpleSelected.has(svc.id);
    })
    .map(svc => {
      const kind = kindOfCheckoutService(svc);
      let fee = 0;
      if (kind === 'preelly') {
        fee = payPreellyFee;
      } else if (kind === 'pickdrop') {
        fee = Number(state.pickDropInfo?.total ?? pickDropFixCost);
      } else {
        fee = svc.priceType === 'FREE' ? 0 : Number(svc.price ?? 0);
      }
      return {
        id: svc.id,
        name: svc.serviceName,
        fee: roundMoney(fee),
      };
    });
};

export const formatCartDate = (iso: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatPostedDate = (iso?: string | null): string => {
  if (!iso) {
    return '';
  }
  return `Posted on: ${formatCartDate(iso)}`;
};
