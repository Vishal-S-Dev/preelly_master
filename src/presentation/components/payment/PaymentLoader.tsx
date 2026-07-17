import React, { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { PAYMENT_COLORS, paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  message?: string;
}

export const PaymentLoader = memo<Props>(
  ({ message = 'Processing payment…' }) => (
    <View style={paymentStyles.center}>
      <ActivityIndicator size="large" color={PAYMENT_COLORS.primary} />
      <Text style={[paymentStyles.statusSubtitle, { marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  ),
);

PaymentLoader.displayName = 'PaymentLoader';
