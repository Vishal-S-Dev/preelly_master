import React, { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PaymentStatus, PaymentTransaction } from '../../../types/payment.types';
import { formatAed } from '../../../utils/checkoutTotals';
import { PAYMENT_COLORS, paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  item: PaymentTransaction;
  onPress?: () => void;
  onDownloadInvoice?: () => void;
  onRetry?: () => void;
}

const badgeColors = (status: PaymentStatus) => {
  switch (status) {
    case 'SUCCESS':
      return { bg: PAYMENT_COLORS.successBg, fg: PAYMENT_COLORS.success };
    case 'FAILED':
      return { bg: PAYMENT_COLORS.dangerBg, fg: PAYMENT_COLORS.danger };
    case 'PENDING':
      return { bg: PAYMENT_COLORS.warningBg, fg: PAYMENT_COLORS.warning };
    case 'CANCELLED':
      return { bg: PAYMENT_COLORS.cancelledBg, fg: PAYMENT_COLORS.cancelled };
    case 'REFUNDED':
      return { bg: '#EEF2FF', fg: PAYMENT_COLORS.primary };
    default:
      return { bg: PAYMENT_COLORS.cancelledBg, fg: PAYMENT_COLORS.muted };
  }
};

export const TransactionCard = memo<Props>(
  ({ item, onPress, onDownloadInvoice, onRetry }) => {
    const colors = useMemo(() => badgeColors(item.status), [item.status]);

    return (
      <Pressable onPress={onPress} style={paymentStyles.txCard}>
        <View style={paymentStyles.txTop}>
          <Text style={paymentStyles.txOrder} numberOfLines={1}>
            {item.orderId}
          </Text>
          <View style={[paymentStyles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[paymentStyles.badgeText, { color: colors.fg }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={paymentStyles.txAmount}>{formatAed(item.amount)}</Text>
        <Text style={paymentStyles.txMeta}>
          {[item.packageName, item.paymentMethod, item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <View style={paymentStyles.txActions}>
          {item.status === 'SUCCESS' && onDownloadInvoice ? (
            <Pressable onPress={onDownloadInvoice} hitSlop={8}>
              <Text style={paymentStyles.txActionText}>Download Invoice</Text>
            </Pressable>
          ) : null}
          {(item.status === 'FAILED' || item.status === 'CANCELLED') && onRetry ? (
            <Pressable onPress={onRetry} hitSlop={8}>
              <Text style={paymentStyles.txActionText}>Retry Payment</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  },
);

TransactionCard.displayName = 'TransactionCard';
