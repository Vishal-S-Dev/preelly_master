import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { PaymentTransaction } from '../../../types/payment.types';
import { formatAed } from '../../../utils/checkoutTotals';
import { paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  transaction: PaymentTransaction;
}

export const PaymentStatusCard = memo<Props>(({ transaction }) => (
  <View style={paymentStyles.card}>
    <View style={paymentStyles.row}>
      <Text style={paymentStyles.rowLabel}>Order ID</Text>
      <Text style={paymentStyles.rowValue} numberOfLines={1}>
        {transaction.orderId}
      </Text>
    </View>
    {transaction.transactionId ? (
      <View style={paymentStyles.row}>
        <Text style={paymentStyles.rowLabel}>Transaction ID</Text>
        <Text style={paymentStyles.rowValue} numberOfLines={1}>
          {transaction.transactionId}
        </Text>
      </View>
    ) : null}
    <View style={paymentStyles.row}>
      <Text style={paymentStyles.rowLabel}>Amount</Text>
      <Text style={paymentStyles.rowValue}>
        {formatAed(transaction.amount)}
      </Text>
    </View>
    {transaction.paymentMethod ? (
      <View style={paymentStyles.row}>
        <Text style={paymentStyles.rowLabel}>Payment method</Text>
        <Text style={paymentStyles.rowValue}>{transaction.paymentMethod}</Text>
      </View>
    ) : null}
    {transaction.createdAt ? (
      <View style={[paymentStyles.row, { marginBottom: 0 }]}>
        <Text style={paymentStyles.rowLabel}>Date</Text>
        <Text style={paymentStyles.rowValue}>
          {new Date(transaction.createdAt).toLocaleString()}
        </Text>
      </View>
    ) : null}
  </View>
));

PaymentStatusCard.displayName = 'PaymentStatusCard';
