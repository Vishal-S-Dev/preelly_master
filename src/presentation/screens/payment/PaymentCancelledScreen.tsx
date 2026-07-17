import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PaymentResultView } from './PaymentResultView';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentCancelled'>;

export const PaymentCancelledScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount, transactionId, message } = route.params;

  const goHome = useCallback(() => {
    navigation.popToTop();
    navigation.navigate('MainTabs');
  }, [navigation]);

  const viewTx = useCallback(() => {
    navigation.replace('PaymentHistory');
  }, [navigation]);

  const onRetry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <PaymentResultView
      kind="cancelled"
      title="Payment Cancelled"
      subtitle={message || 'You cancelled the payment before it was completed.'}
      orderId={orderId}
      amount={amount}
      transaction={{
        id: transactionId || orderId,
        orderId,
        transactionId,
        amount: amount ?? 0,
        currency: route.params.currency || 'AED',
        status: 'CANCELLED',
        raw: {},
      }}
      onHome={goHome}
      onViewTransactions={viewTx}
      onRetry={onRetry}
    />
  );
};
