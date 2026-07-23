import { AxiosRequestConfig } from 'axios';
import { PaymentApi, PaymentCheckoutInitiateRequest } from '../data/api/PaymentApi';
import {
  PaymentHistoryPage,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentTransaction,
} from '../types/payment.types';
import { getPaymentErrorMessage } from '../utils/paymentUtils';
import { downloadPaymentInvoiceFile } from '../utils/invoiceDownload';

export const paymentService = {
  async initiatePayment(
    request: PaymentInitiateRequest,
    config?: AxiosRequestConfig,
  ): Promise<PaymentInitiateResponse> {
    if (!request.productId && !request.packageId && !request.storageFacilityId) {
      throw new Error('Select a product, package, or storage facility to pay.');
    }
    try {
      return await PaymentApi.initiatePayment(request, config);
    } catch (error) {
      throw new Error(getPaymentErrorMessage(error));
    }
  },

  /**
   * Buyer cart checkout — product price + add-on services via CCAvenue.
   * Backend: POST /api/payment/checkout/initiate
   */
  async initiateCheckoutPayment(
    request: PaymentCheckoutInitiateRequest,
    config?: AxiosRequestConfig,
  ): Promise<PaymentInitiateResponse> {
    if (!request.productId?.trim()) {
      throw new Error('Missing product for checkout.');
    }
    try {
      return await PaymentApi.initiateCheckoutPayment(request, config);
    } catch (error) {
      throw new Error(getPaymentErrorMessage(error));
    }
  },

  async getTransaction(
    orderId: string,
    config?: AxiosRequestConfig,
  ): Promise<PaymentTransaction> {
    try {
      return await PaymentApi.getTransaction(orderId, config);
    } catch (error) {
      throw new Error(getPaymentErrorMessage(error));
    }
  },

  async getTransactions(
    params?: { page?: number; limit?: number; search?: string; status?: string },
    config?: AxiosRequestConfig,
  ): Promise<PaymentHistoryPage> {
    try {
      return await PaymentApi.getTransactions(params, config);
    } catch (error) {
      throw new Error(getPaymentErrorMessage(error));
    }
  },

  /**
   * Poll transaction until terminal status or timeout.
   * Backend callback processes payment asynchronously.
   */
  async waitForTransactionStatus(
    orderId: string,
    options: { timeoutMs?: number; intervalMs?: number } = {},
  ): Promise<PaymentTransaction> {
    const timeoutMs = options.timeoutMs ?? 90000;
    const intervalMs = options.intervalMs ?? 2500;
    const started = Date.now();
    let last: PaymentTransaction | null = null;

    while (Date.now() - started < timeoutMs) {
      last = await paymentService.getTransaction(orderId);
      if (
        last.status === 'SUCCESS' ||
        last.status === 'FAILED' ||
        last.status === 'CANCELLED' ||
        last.status === 'REFUNDED'
      ) {
        return last;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return (
      last ?? {
        id: orderId,
        orderId,
        amount: 0,
        currency: 'AED',
        status: 'PENDING',
        raw: {},
      }
    );
  },

  async downloadInvoice(transactionId: string): Promise<string> {
    try {
      return await downloadPaymentInvoiceFile(transactionId);
    } catch (error) {
      throw new Error(getPaymentErrorMessage(error));
    }
  },
};
