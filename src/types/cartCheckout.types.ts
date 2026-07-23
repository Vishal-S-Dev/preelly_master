export interface CheckoutServiceHighlight {
  id?: string;
  highlight?: string;
  displayOrder?: number;
}

export type CheckoutServicePriceType = 'FIXED' | 'STARTING_FROM' | 'FREE';

export interface CheckoutService {
  id: string;
  serviceName: string;
  description?: string;
  priceType: CheckoutServicePriceType;
  price: number;
  learnMoreUrl?: string;
  buttonText?: string;
  displayOrder?: number;
  isDefault?: boolean;
  status?: boolean;
  highlights?: CheckoutServiceHighlight[];
}

export interface CartProductCategoryRef {
  _id?: string;
  name?: string;
}

export interface CartProductFeatureGroup {
  values?: string[];
}

export interface CartPopulatedProduct {
  _id?: string;
  id?: string;
  title?: string;
  images?: string[];
  video?: string;
  productPrice?: number;
  price?: number;
  year?: number | string;
  kilometers?: number | string;
  mileage?: number | string;
  condition?: string;
  category?: CartProductCategoryRef;
  subcategory?: CartProductCategoryRef | string;
  features?: CartProductFeatureGroup[];
}

export interface CartItem {
  _id?: string;
  productId?: string | CartPopulatedProduct | null;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  totalAmount?: number;
  cartStatus?: string;
}

export interface PickDropInfo {
  date: string;
  timeSlot: string;
  address: string;
  addr1: string;
  addr2: string;
  lat: number;
  lng: number;
  fixCost: number;
  deliveryCost: number;
  total: number;
}

export interface PreellyPayInfo {
  conditions: string[];
  comment: string;
}

export interface BuyerCouponValidation {
  valid?: boolean;
  couponCode?: string;
  discountAmount?: number;
  finalAmount?: number | null;
  message?: string;
}

export interface CartCheckoutServiceRow {
  id: string;
  name: string;
  fee: number;
}

export interface CartCheckoutTotals {
  productFee: number;
  addonsTotal: number;
  base: number;
  discountAmount: number;
  vatValue: number;
  total: number;
}
