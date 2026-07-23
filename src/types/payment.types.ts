/** Payment domain types — mapped flexibly from backend payloads. */

export type PaymentStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'UNKNOWN';

export interface PaymentInitiateRequest {
  productId?: string;
  packageId?: string;
  storageFacilityId?: string;
  couponCode?: string;
}

/** Normalized CCAvenue session data used by the WebView. */
export interface PaymentInitiateResponse {
  accessCode: string;
  encRequest: string;
  merchantId?: string;
  orderId: string;
  amount?: number;
  currency?: string;
  paymentUrl: string;
  redirectUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  /** Raw backend payload for forward-compat. */
  raw: Record<string, unknown>;
}

export interface PaymentInvoice {
  id?: string;
  url?: string;
  number?: string;
  fileName?: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  packageName?: string;
  productId?: string;
  packageId?: string;
  invoice?: PaymentInvoice;
  createdAt?: string;
  updatedAt?: string;
  failureReason?: string;
  raw: Record<string, unknown>;
}

export interface PaymentHistoryPage {
  items: PaymentTransaction[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type PaymentWebViewOutcome = 'success' | 'failure' | 'cancel' | 'unknown';

export type PaymentFlowKind = 'cart' | 'post-ad';

export interface PaymentResultParams {
  orderId: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  message?: string;
  /** When true, close CreatePost modal after leaving result. */
  closeCreatePost?: boolean;
  /** Cart checkout vs post-ad package payment — drives retry / home navigation. */
  paymentFlow?: PaymentFlowKind;
  productId?: string;
}
