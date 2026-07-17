import React, { memo, useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { PaymentTransaction } from '../../../types/payment.types';
import { InvoiceCard } from '../../components/payment/InvoiceCard';
import { PaymentButton } from '../../components/payment/PaymentButton';
import { PaymentStatusCard } from '../../components/payment/PaymentStatusCard';
import { useInvoiceDownload } from '../../hooks/useInvoiceDownload';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { PAYMENT_COLORS, paymentStyles } from './paymentStyles';

export type PaymentResultKind = 'success' | 'failed' | 'pending' | 'cancelled';

interface Props {
  kind: PaymentResultKind;
  title: string;
  subtitle: string;
  transaction?: PaymentTransaction | null;
  orderId?: string;
  amount?: number;
  onHome: () => void;
  onViewTransactions: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  showInvoice?: boolean;
}

const KIND_META: Record<
  PaymentResultKind,
  { icon: string; bg: string; color: string }
> = {
  success: {
    icon: 'check-circle',
    bg: PAYMENT_COLORS.successBg,
    color: PAYMENT_COLORS.success,
  },
  failed: {
    icon: 'close-circle',
    bg: PAYMENT_COLORS.dangerBg,
    color: PAYMENT_COLORS.danger,
  },
  pending: {
    icon: 'clock-outline',
    bg: PAYMENT_COLORS.warningBg,
    color: PAYMENT_COLORS.warning,
  },
  cancelled: {
    icon: 'cancel',
    bg: PAYMENT_COLORS.cancelledBg,
    color: PAYMENT_COLORS.cancelled,
  },
};

export const PaymentResultView = memo<Props>(
  ({
    kind,
    title,
    subtitle,
    transaction,
    orderId,
    amount,
    onHome,
    onViewTransactions,
    onRetry,
    retryLabel = 'Retry Payment',
    showInvoice,
  }) => {
    const insets = useStableSafeAreaInsets();
    const meta = KIND_META[kind];
    const { downloading, download } = useInvoiceDownload();

    const tx = useMemo(() => {
      if (transaction) {
        return transaction;
      }
      if (!orderId) {
        return null;
      }
      return {
        id: orderId,
        orderId,
        amount: amount ?? 0,
        currency: 'AED',
        status:
          kind === 'success'
            ? ('SUCCESS' as const)
            : kind === 'failed'
              ? ('FAILED' as const)
              : kind === 'cancelled'
                ? ('CANCELLED' as const)
                : ('PENDING' as const),
        raw: {},
      };
    }, [amount, kind, orderId, transaction]);

    const onDownload = useCallback(() => {
      if (!tx) {
        return;
      }
      download(tx.id || tx.orderId);
    }, [download, tx]);

    return (
      <View
        style={[
          paymentStyles.screen,
          paymentStyles.center,
          { paddingBottom: Math.max(insets.bottom, 20), paddingTop: insets.top + 24 },
        ]}
      >
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <View style={[paymentStyles.statusIconWrap, { backgroundColor: meta.bg }]}>
            <Icon name={meta.icon} size={48} color={meta.color} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)} style={{ width: '100%', alignItems: 'center' }}>
          <Text style={paymentStyles.statusTitle}>{title}</Text>
          <Text style={paymentStyles.statusSubtitle}>{subtitle}</Text>
        </Animated.View>

        {tx ? (
          <Animated.View entering={FadeInDown.delay(140)} style={{ width: '100%' }}>
            <PaymentStatusCard transaction={tx} />
          </Animated.View>
        ) : null}

        {showInvoice && tx && kind === 'success' ? (
          <InvoiceCard
            invoiceNumber={tx.invoice?.number}
            downloading={downloading}
            onDownload={onDownload}
          />
        ) : null}

        {onRetry ? (
          <PaymentButton label={retryLabel} onPress={onRetry} />
        ) : null}
        <PaymentButton label="View Transactions" onPress={onViewTransactions} variant="secondary" />
        <PaymentButton label="Go Home" onPress={onHome} variant="link" />
      </View>
    );
  },
);

PaymentResultView.displayName = 'PaymentResultView';
