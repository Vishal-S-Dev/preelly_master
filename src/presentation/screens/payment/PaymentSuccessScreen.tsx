import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PaymentResultView } from './PaymentResultView';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export const PaymentSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, amount, transactionId, closeCreatePost, message } = route.params;

  const goHome = useCallback(() => {
    if (route.params.closeCreatePost) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      return;
    }
    navigation.popToTop();
    navigation.navigate('MainTabs');
  }, [navigation, route.params.closeCreatePost]);

  const viewTx = useCallback(() => {
    navigation.replace('PaymentHistory');
  }, [navigation]);

  return (
    <PaymentResultView
      kind="success"
      title="Payment Successful"
      subtitle={
        message ||
        'Your payment was completed successfully. An invoice is available in Transactions.'
      }
      orderId={orderId}
      amount={amount}
      transaction={{
        id: transactionId || orderId,
        orderId,
        transactionId,
        amount: amount ?? 0,
        currency: route.params.currency || 'AED',
        status: 'SUCCESS',
        raw: {},
      }}
      showInvoice
      onHome={goHome}
      onViewTransactions={viewTx}
    />
  );
};
