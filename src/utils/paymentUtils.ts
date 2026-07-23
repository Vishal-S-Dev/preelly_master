import {
  PaymentHistoryPage,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentInvoice,
  PaymentStatus,
  PaymentTransaction,
} from './payment.types';
import { getDevCcavenueInitiateOverrides } from '../constants/ccavenueEnv';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const pickString = (
  source: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
};

const pickNumber = (
  source: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const n = Number(value.replace(/,/g, ''));
      if (Number.isFinite(n)) {
        return n;
      }
    }
  }
  return undefined;
};

const unwrapData = (payload: unknown): Record<string, unknown> => {
  const root = asRecord(payload);
  const nested = asRecord(root.data);
  return Object.keys(nested).length > 0 ? { ...root, ...nested } : root;
};

export const normalizePaymentStatus = (value?: string | null): PaymentStatus => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  if (
    normalized === 'SUCCESS' ||
    normalized === 'SUCCESSFUL' ||
    normalized === 'PAID' ||
    normalized === 'COMPLETED' ||
    normalized === 'CAPTURED'
  ) {
    return 'SUCCESS';
  }
  if (
    normalized === 'FAILED' ||
    normalized === 'FAILURE' ||
    normalized === 'ERROR' ||
    normalized === 'DECLINED'
  ) {
    return 'FAILED';
  }
  if (
    normalized === 'CANCELLED' ||
    normalized === 'CANCELED' ||
    normalized === 'ABORTED'
  ) {
    return 'CANCELLED';
  }
  if (normalized === 'REFUNDED' || normalized === 'REFUND') {
    return 'REFUNDED';
  }
  if (
    normalized === 'PENDING' ||
    normalized === 'PROCESSING' ||
    normalized === 'INITIATED' ||
    normalized === 'IN_PROGRESS'
  ) {
    return 'PENDING';
  }
  return 'UNKNOWN';
};

export const mapPaymentInitiateResponse = (
  payload: unknown,
): PaymentInitiateResponse => {
  const source = unwrapData(payload);
  const accessCode = pickString(source, [
    'accessCode',
    'access_code',
    'accesscode',
  ]);
  const encRequest = pickString(source, [
    'encRequest',
    'enc_request',
    'encryptedRequest',
    'encrypted_request',
  ]);
  const orderId = pickString(source, [
    'orderId',
    'order_id',
    'orderNo',
    'order_no',
    'trackingId',
    'tracking_id',
    'id',
  ]);
  const paymentUrl = pickString(source, [
    'paymentUrl',
    'payment_url',
    'ccavenueUrl',
    'ccavenue_url',
    'gatewayUrl',
    'gateway_url',
    'url',
  ]);

  if (!accessCode || !encRequest || !orderId || !paymentUrl) {
    throw new Error(
      'Payment initiate response is missing required CCAvenue fields.',
    );
  }

  return {
    accessCode,
    encRequest,
    merchantId: pickString(source, ['merchantId', 'merchant_id', 'merchant']),
    orderId,
    amount: pickNumber(source, ['amount', 'totalAmount', 'total_amount']),
    currency: pickString(source, ['currency', 'currencyCode']) ?? 'AED',
    paymentUrl,
    redirectUrl: pickString(source, [
      'redirectUrl',
      'redirect_url',
      'successUrl',
      'success_url',
    ]),
    cancelUrl: pickString(source, ['cancelUrl', 'cancel_url']),
    callbackUrl: pickString(source, [
      'callbackUrl',
      'callback_url',
      'returnUrl',
      'return_url',
    ]),
    raw: source,
  };
};

const mapInvoice = (source: Record<string, unknown>): PaymentInvoice | undefined => {
  const invoiceObj = asRecord(source.invoice);
  const url =
    pickString(invoiceObj, ['url', 'invoiceUrl', 'downloadUrl', 'fileUrl']) ??
    pickString(source, [
      'invoiceUrl',
      'invoice_url',
      'downloadUrl',
      'download_url',
    ]);
  const number =
    pickString(invoiceObj, ['number', 'invoiceNumber', 'invoice_number']) ??
    pickString(source, ['invoiceNumber', 'invoice_number']);
  const id =
    pickString(invoiceObj, ['id', 'invoiceId']) ??
    pickString(source, ['invoiceId', 'invoice_id']);

  if (!url && !number && !id) {
    return undefined;
  }

  return {
    id,
    url,
    number,
    fileName:
      pickString(invoiceObj, ['fileName', 'filename', 'name']) ??
      (number ? `invoice-${number}.pdf` : undefined),
  };
};

export const mapPaymentTransaction = (payload: unknown): PaymentTransaction => {
  const source = unwrapData(payload);
  const orderId =
    pickString(source, [
      'orderId',
      'order_id',
      'orderNo',
      'order_no',
      'id',
    ]) ?? '';
  const id =
    pickString(source, ['id', 'transactionId', 'transaction_id', '_id']) ??
    orderId;

  return {
    id,
    orderId,
    transactionId: pickString(source, [
      'transactionId',
      'transaction_id',
      'trackingId',
      'tracking_id',
      'bankRefNo',
      'bank_ref_no',
    ]),
    amount: pickNumber(source, ['amount', 'totalAmount', 'total_amount']) ?? 0,
    currency: pickString(source, ['currency', 'currencyCode']) ?? 'AED',
    status: normalizePaymentStatus(
      pickString(source, ['status', 'paymentStatus', 'payment_status', 'orderStatus']),
    ),
    paymentMethod: pickString(source, [
      'paymentMethod',
      'payment_method',
      'paymentMode',
      'payment_mode',
      'cardName',
    ]),
    packageName: pickString(source, ['packageName', 'package_name', 'title']),
    productId: pickString(source, ['productId', 'product_id']),
    packageId: pickString(source, ['packageId', 'package_id']),
    invoice: mapInvoice(source),
    createdAt: pickString(source, ['createdAt', 'created_at', 'paidAt', 'date']),
    updatedAt: pickString(source, ['updatedAt', 'updated_at']),
    failureReason: pickString(source, [
      'failureReason',
      'failure_reason',
      'errorMessage',
      'message',
      'statusMessage',
    ]),
    raw: source,
  };
};

export const mapPaymentHistoryPage = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): PaymentHistoryPage => {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const listCandidate =
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(data.items) && data.items) ||
    (Array.isArray(data.transactions) && data.transactions) ||
    (Array.isArray(data.results) && data.results) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.transactions) && root.transactions) ||
    (Array.isArray(payload) && payload) ||
    [];

  const items = (listCandidate as unknown[]).map(mapPaymentTransaction);
  const page =
    pickNumber(data, ['page', 'currentPage', 'current_page']) ??
    pickNumber(root, ['page', 'currentPage']) ??
    fallbackPage;
  const limit =
    pickNumber(data, ['limit', 'pageSize', 'page_size']) ??
    pickNumber(root, ['limit', 'pageSize']) ??
    fallbackLimit;
  const total =
    pickNumber(data, ['total', 'totalCount', 'total_count', 'count']) ??
    pickNumber(root, ['total', 'totalCount']) ??
    items.length;
  const hasMoreExplicit = data.hasMore ?? root.hasMore ?? data.has_more;
  const hasMore =
    typeof hasMoreExplicit === 'boolean'
      ? hasMoreExplicit
      : page * limit < total;

  return { items, page, limit, total, hasMore };
};

export const buildInitiateBody = (
  input: PaymentInitiateRequest,
): Record<string, string> => {
  const body: Record<string, string> = {
    ...getDevCcavenueInitiateOverrides(),
  };
  if (input.productId?.trim()) {
    body.productId = input.productId.trim();
  }
  if (input.packageId?.trim()) {
    body.packageId = input.packageId.trim();
  }
  if (input.storageFacilityId?.trim()) {
    body.storageFacilityId = input.storageFacilityId.trim();
  }
  if (input.couponCode?.trim()) {
    body.couponCode = input.couponCode.trim();
  }
  return body;
};

const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Origin-only base URL for HTML WebView (query strings in baseUrl break iOS WKWebView). */
export const resolveCcavenueHtmlBaseUrl = (paymentUrl: string): string => {
  // Use about:blank so WKWebView does NOT attempt a network connection for the
  // initial HTML document. Form action stays an absolute https://secure.ccavenue.ae URL.
  // A remote baseUrl (e.g. https://secure.ccavenue.ae/) can surface NSURLErrorDomain -1004
  // before the form even posts.
  void paymentUrl;
  return 'about:blank';
};

/**
 * Auto-submit HTML form — same approach as web CartCheckoutPage.
 * This is the production-safe path for React Native WebView (iOS does not
 * reliably support source={{ method: 'POST', body }}).
 */
export const buildCcavenueCheckoutHtml = (
  session: PaymentInitiateResponse,
): string => {
  const action = escapeHtmlAttr(session.paymentUrl);
  const enc = escapeHtmlAttr(session.encRequest);
  const access = escapeHtmlAttr(session.accessCode);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>Secure Payment</title>
    <style>
      html, body { margin:0; padding:0; min-height:100%; background:#fff; color:#1B2B6B;
        font-family: -apple-system, Helvetica, Arial, sans-serif; }
      .box { display:flex; flex-direction:column; align-items:center; justify-content:center;
        min-height:100vh; padding:24px; text-align:center; box-sizing:border-box; }
      .spinner { width:36px; height:36px; border:3px solid #E5E7EB; border-top-color:#0000FF;
        border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="spinner"></div>
      <p>Redirecting to secure payment…</p>
    </div>
    <form id="nonseamless" method="post" action="${action}">
      <input type="hidden" name="encRequest" id="encRequest" value="${enc}" />
      <input type="hidden" name="access_code" id="access_code" value="${access}" />
    </form>
    <script>
      (function () {
        function submitForm() {
          var form = document.getElementById('nonseamless');
          if (form) { form.submit(); }
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', submitForm);
        } else {
          submitForm();
        }
        setTimeout(submitForm, 250);
      })();
    </script>
  </body>
</html>`;
};

/** Native POST source — Android fallback only; iOS WKWebView often ignores body. */
export const buildCcavenueWebViewSource = (session: PaymentInitiateResponse) => {
  const body = [
    `encRequest=${encodeURIComponent(session.encRequest)}`,
    `access_code=${encodeURIComponent(session.accessCode)}`,
  ].join('&');

  return {
    uri: session.paymentUrl,
    method: 'POST' as const,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  };
};

const IGNORED_WEBVIEW_URL_PREFIXES = ['about:', 'data:', 'blob:'];

export const isCcavenueGatewayUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.includes('ccavenue') || lower.includes('secure.ccavenue');
};

/** True only for post-payment callback / result URLs (not the gateway entry page). */
export const isPaymentCompletionUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  if (IGNORED_WEBVIEW_URL_PREFIXES.some(prefix => lower.startsWith(prefix))) {
    return false;
  }
  return (
    lower.includes('/api/payment/ccavenue/callback') ||
    lower.includes('/payment/ccavenue/callback') ||
    lower.includes('/cart/payment/success') ||
    lower.includes('/cart/payment/failure') ||
    lower.includes('/post-ad/payment/success') ||
    lower.includes('/post-ad/payment/failure') ||
    lower.includes('encresp=') ||
    lower.includes('enc_resp=')
  );
};

export const getPaymentErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }
  if (typeof error === 'string') {
    return error;
  }
  const err = error as {
    message?: string;
    code?: string;
    response?: { status?: number; data?: { message?: string } };
  };
  const status = err.response?.status;
  const serverMessage = err.response?.data?.message;
  if (
    typeof serverMessage === 'string' &&
    serverMessage.toLowerCase().includes('ccavenue is not configured')
  ) {
    return __DEV__
      ? 'Payment gateway is not configured on the server. Add CCA_* to backend .env, or enable dev credentials in app .env for testing.'
      : 'Payment is temporarily unavailable. Please try again later.';
  }
  if (status === 401) {
    return 'Your session expired. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to complete this payment.';
  }
  if (status === 500 || (status != null && status >= 500)) {
    return 'Payment service is temporarily unavailable. Please try again.';
  }
  if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
    return 'No internet connection. Check your network and try again.';
  }
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  return serverMessage || err.message || 'Unable to process payment right now.';
};
