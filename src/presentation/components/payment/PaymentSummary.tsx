import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { formatAed } from '../../../utils/checkoutTotals';
import { paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  packageName?: string;
  amount: number;
  vatLabel?: string;
  storageLabel?: string;
}

export const PaymentSummary = memo<Props>(
  ({ packageName, amount, vatLabel, storageLabel }) => (
    <View style={paymentStyles.card}>
      {packageName ? (
        <View style={paymentStyles.row}>
          <Text style={paymentStyles.rowLabel}>Package</Text>
          <Text style={paymentStyles.rowValue}>{packageName}</Text>
        </View>
      ) : null}
      {storageLabel ? (
        <View style={paymentStyles.row}>
          <Text style={paymentStyles.rowLabel}>Storage</Text>
          <Text style={paymentStyles.rowValue}>{storageLabel}</Text>
        </View>
      ) : null}
      {vatLabel ? (
        <View style={paymentStyles.row}>
          <Text style={paymentStyles.rowLabel}>VAT</Text>
          <Text style={paymentStyles.rowValue}>{vatLabel}</Text>
        </View>
      ) : null}
      <View style={[paymentStyles.row, { marginBottom: 0 }]}>
        <Text style={[paymentStyles.rowLabel, { fontWeight: '700' }]}>Total</Text>
        <Text style={paymentStyles.rowValue}>{formatAed(amount)}</Text>
      </View>
    </View>
  ),
);

PaymentSummary.displayName = 'PaymentSummary';
