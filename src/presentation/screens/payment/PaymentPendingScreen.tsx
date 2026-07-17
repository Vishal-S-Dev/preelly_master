import React, { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PaymentResultView } from './PaymentResultView';
import { paymentService } from '../../../services/payment.service';
import { getPaymentErrorMessage } from '../../../utils/paymentUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentPending'>;

export const PaymentPendingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount, transactionId, message, closeCreatePost } = route.params;
  const [checking, setChecking] = useState(false);

  const goHome = useCallback(() => {
    navigation.popToTop();
    navigation.navigate('MainTabs');
  }, [navigation]);

  const viewTx = useCallback(() => {
    navigation.replace('PaymentHistory');
  }, [navigation]);

  const checkStatus = useCallback(async () => {
    if (!orderId || checking) {
      return;
    }
    setChecking(true);
    try {
      const tx = await paymentService.waitForTransactionStatus(orderId, {
        timeoutMs: 30000,
        intervalMs: 2000,
      });
      const common = {
        orderId: tx.orderId || orderId,
        transactionId: tx.transactionId || transactionId,
        amount: tx.amount || amount,
        currency: tx.currency,
        status: tx.status,
        message: tx.failureReason,
        closeCreatePost,
      };

      if (tx.status === 'SUCCESS') {
        navigation.replace('PaymentSuccess', common);
      } else if (tx.status === 'FAILED') {
        navigation.replace('PaymentFailed', common);
      } else if (tx.status === 'CANCELLED') {
        navigation.replace('PaymentCancelled', common);
      }
    } catch (error) {
      navigation.setParams({
        message: getPaymentErrorMessage(error),
      });
    } finally {
      setChecking(false);
    }
  }, [amount, checking, closeCreatePost, navigation, orderId, transactionId]);

  return (
    <PaymentResultView
      kind="pending"
      title="Payment Pending"
      subtitle={
        message ||
        'Your payment is being confirmed. Complete payment on CCAvenue, then tap Check Status.'
      }
      orderId={orderId}
      amount={amount}
      transaction={{
        id: transactionId || orderId,
        orderId,
        transactionId,
        amount: amount ?? 0,
        currency: route.params.currency || 'AED',
        status: 'PENDING',
        raw: {},
      }}
      onHome={goHome}
      onViewTransactions={viewTx}
      onRetry={checking ? undefined : checkStatus}
      retryLabel="Check Status"
    />
  );
};
