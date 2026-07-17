import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PAYMENT_COLORS, paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  message: string;
  onRetry?: () => void;
}

export const PaymentError = memo<Props>(({ message, onRetry }) => (
  <View style={paymentStyles.center}>
    <Icon name="alert-circle-outline" size={48} color={PAYMENT_COLORS.danger} />
    <Text style={[paymentStyles.errorText, { marginTop: 12 }]}>{message}</Text>
    {onRetry ? (
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={paymentStyles.linkBtnText}>Retry</Text>
      </Pressable>
    ) : null}
  </View>
));

PaymentError.displayName = 'PaymentError';
