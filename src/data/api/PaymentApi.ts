import { AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  PaymentHistoryPage,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentTransaction,
} from '../../types/payment.types';
import {
  buildInitiateBody,
  mapPaymentHistoryPage,
  mapPaymentInitiateResponse,
  mapPaymentTransaction,
} from '../../utils/paymentUtils';
import { httpClient } from './httpClient';
import { getDevCcavenueInitiateOverrides } from '../../constants/ccavenueEnv';
import { PAYMENT_TYPE, resolvePaymentFrom } from '../../utils/paymentPlatform';

export interface PaymentCheckoutInitiateRequest {
  productId: string;
  services?: Array<{ checkoutServiceId: string; amount: number }>;
  couponCode?: string | null;
  pickDrop?: unknown;
  preelly?: unknown;
  /** Defaults to checkout (2) for cart / chat payments. */
  paymentType?: number;
  /** 1 Web, 2 Android, 3 iOS — auto-detected when omitted. */
  paymentFrom?: number;
}

const withRetryGet = async <T>(
  request: () => Promise<T>,
  retries = 1,
): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), 600);
    });
    return withRetryGet(request, retries - 1);
  }
};

export const PaymentApi = {
  async initiatePayment(
    body: PaymentInitiateRequest,
    config?: AxiosRequestConfig,
  ): Promise<PaymentInitiateResponse> {
    const { data } = await httpClient.post(
      API_ENDPOINTS.PAYMENT_INITIATE,
      buildInitiateBody(body),
      config,
    );
    return mapPaymentInitiateResponse(data);
  },

  /**
   * Product checkout payment flow (buyer pays for product + add-ons).
   * Backend: POST /api/payment/checkout/initiate
   */
  async initiateCheckoutPayment(
    body: PaymentCheckoutInitiateRequest,
    config?: AxiosRequestConfig,
  ): Promise<PaymentInitiateResponse> {
    const payload = {
      ...getDevCcavenueInitiateOverrides(),
      productId: body.productId,
      paymentType: body.paymentType ?? PAYMENT_TYPE.CHECKOUT,
      paymentFrom: body.paymentFrom ?? resolvePaymentFrom(),
      ...(body.services ? { services: body.services } : {}),
      couponCode: body.couponCode ?? null,
      ...(body.pickDrop !== undefined ? { pickDrop: body.pickDrop } : {}),
      ...(body.preelly !== undefined ? { preelly: body.preelly } : {}),
    };

    const { data } = await httpClient.post(
      API_ENDPOINTS.PAYMENT_CHECKOUT_INITIATE,
      payload,
      config,
    );
    return mapPaymentInitiateResponse(data);
  },

  async getTransaction(
    orderId: string,
    config?: AxiosRequestConfig,
  ): Promise<PaymentTransaction> {
    return withRetryGet(async () => {
      const { data } = await httpClient.get(
        `${API_ENDPOINTS.PAYMENT_TRANSACTIONS}/${encodeURIComponent(orderId)}`,
        config,
      );
      return mapPaymentTransaction(data);
    });
  },

  async getTransactions(
    params: { page?: number; limit?: number; search?: string; status?: string } = {},
    config?: AxiosRequestConfig,
  ): Promise<PaymentHistoryPage> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    return withRetryGet(async () => {
      const { data } = await httpClient.get(API_ENDPOINTS.PAYMENT_TRANSACTIONS, {
        ...config,
        params: {
          page,
          limit,
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      });
      return mapPaymentHistoryPage(data, page, limit);
    });
  },

  /**
   * Download invoice bytes for a transaction.
   * Tries dedicated invoice path first, then falls back to invoice URL on the transaction.
   */
  async downloadInvoice(
    transactionId: string,
    config?: AxiosRequestConfig,
  ): Promise<{ uri: string; fileName: string; blob?: Blob }> {
    const invoicePath = `${API_ENDPOINTS.PAYMENT_TRANSACTIONS}/${encodeURIComponent(
      transactionId,
    )}/invoice`;

    try {
      const response = await httpClient.get(invoicePath, {
        ...config,
        responseType: 'blob',
      });
      const fileName =
        (typeof response.headers?.['content-disposition'] === 'string' &&
          response.headers['content-disposition'].match(
            /filename="?([^"]+)"?/i,
          )?.[1]) ||
        `invoice-${transactionId}.pdf`;
      return { uri: invoicePath, fileName, blob: response.data as Blob };
    } catch {
      const tx = await PaymentApi.getTransaction(transactionId, config);
      if (!tx.invoice?.url) {
        throw new Error('Invoice is not available for this transaction.');
      }
      return {
        uri: tx.invoice.url,
        fileName: tx.invoice.fileName || `invoice-${transactionId}.pdf`,
      };
    }
  },
};
