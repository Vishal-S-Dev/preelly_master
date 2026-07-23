import { useCallback, useRef, useState } from 'react';
import { PaymentCheckoutInitiateRequest } from '../../data/api/PaymentApi';
import { paymentService } from '../../services/payment.service';
import {
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentTransaction,
} from '../../types/payment.types';
import { getPaymentErrorMessage } from '../../utils/paymentUtils';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PaymentInitiateResponse | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightRef.current = false;
    setLoading(false);
    setVerifying(false);
    setError(null);
    setSession(null);
    setTransaction(null);
  }, []);

  const initiate = useCallback(async (request: PaymentInitiateRequest) => {
    if (inFlightRef.current) {
      throw new Error('Payment is already in progress.');
    }
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await paymentService.initiatePayment(request, {
        signal: abortRef.current.signal,
      });
      setSession(result);
      return result;
    } catch (err) {
      const message = getPaymentErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const initiateCheckout = useCallback(async (request: PaymentCheckoutInitiateRequest) => {
    if (inFlightRef.current) {
      throw new Error('Payment is already in progress.');
    }
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await paymentService.initiateCheckoutPayment(request, {
        signal: abortRef.current.signal,
      });
      setSession(result);
      return result;
    } catch (err) {
      const message = getPaymentErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const verifyOrder = useCallback(async (orderId: string) => {
    setVerifying(true);
    setError(null);
    try {
      const tx = await paymentService.waitForTransactionStatus(orderId);
      setTransaction(tx);
      return tx;
    } catch (err) {
      const message = getPaymentErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setVerifying(false);
    }
  }, []);

  const refreshTransaction = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await paymentService.getTransaction(orderId);
      setTransaction(tx);
      return tx;
    } catch (err) {
      const message = getPaymentErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    verifying,
    processing: loading || verifying,
    error,
    session,
    transaction,
    initiate,
    initiateCheckout,
    verifyOrder,
    refreshTransaction,
    reset,
    setError,
  };
};
