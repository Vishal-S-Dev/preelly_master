import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PaymentResultView } from './PaymentResultView';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentFailed'>;

export const PaymentFailedScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount, transactionId, message, paymentFlow, productId } = route.params;

  const goHome = useCallback(() => {
    navigation.popToTop();
    navigation.navigate('MainTabs');
  }, [navigation]);

  const viewTx = useCallback(() => {
    navigation.replace('PaymentHistory');
  }, [navigation]);

  const onRetry = useCallback(() => {
    if (paymentFlow === 'cart' && productId) {
      navigation.replace('CartCheckout', { productId });
      return;
    }
    navigation.goBack();
  }, [navigation, paymentFlow, productId]);

  return (
    <PaymentResultView
      kind="failed"
      title="Payment Failed"
      subtitle={
        message ||
        'We could not complete your payment. You can retry or view transaction history.'
      }
      orderId={orderId}
      amount={amount}
      transaction={{
        id: transactionId || orderId,
        orderId,
        transactionId,
        amount: amount ?? 0,
        currency: route.params.currency || 'AED',
        status: 'FAILED',
        failureReason: message,
        raw: {},
      }}
      onHome={goHome}
      onViewTransactions={viewTx}
      onRetry={onRetry}
    />
  );
};
