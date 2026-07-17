import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PAYMENT_COLORS, paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  invoiceNumber?: string;
  downloading?: boolean;
  onDownload: () => void;
}

export const InvoiceCard = memo<Props>(
  ({ invoiceNumber, downloading, onDownload }) => (
    <View style={paymentStyles.card}>
      <View style={paymentStyles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Icon name="file-pdf-box" size={22} color={PAYMENT_COLORS.danger} />
          <Text style={paymentStyles.rowValue} numberOfLines={1}>
            {invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice'}
          </Text>
        </View>
        <Pressable onPress={onDownload} disabled={downloading} hitSlop={8}>
          {downloading ? (
            <ActivityIndicator color={PAYMENT_COLORS.primary} />
          ) : (
            <Text style={paymentStyles.txActionText}>Download</Text>
          )}
        </Pressable>
      </View>
    </View>
  ),
);

InvoiceCard.displayName = 'InvoiceCard';
