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
  productMultiAttributes?: Array<{
    fieldKey?: string;
    fieldValues?: string[];
  }>;
}

export interface CartItem {
  _id?: string;
  productId?: string | CartPopulatedProduct | null;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  totalAmount?: number;
  cartStatus?: string;
  preellyInspection?: {
    conditions?: string[];
    comment?: string;
    approved?: boolean;
    approvedAt?: string;
    notInterested?: boolean;
    updatedAt?: string;
  };
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
  zoneName?: string;
  zoneCode?: string;
  distanceKm?: number;
}

export interface DeliveryPriceRequest {
  productId: string;
  dropLatitude: number;
  dropLongitude: number;
  dropAddress: string;
  placeId?: string;
}

export interface DeliveryPriceZone {
  id: string;
  name: string;
  code: string;
}

export interface DeliveryPriceDistance {
  meters: number;
  kilometers: number;
  durationSeconds: number;
  provider: string;
}

export interface DeliveryPricePricing {
  pricingType: string;
  currency: string;
  baseFare: number;
  basePrice: number;
  extraKm: number;
  extraKmPrice: number;
  minPrice: number;
  maxPrice: number;
  totalPrice: number;
  appliedSlab: unknown;
}

export interface DeliveryPriceCalculation {
  zone: DeliveryPriceZone;
  pickup: { latitude: number; longitude: number; address: string; source: string };
  drop: { latitude: number; longitude: number; address: string; placeId?: string };
  distance: DeliveryPriceDistance;
  pricing: DeliveryPricePricing;
  calculatedAt: string;
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
