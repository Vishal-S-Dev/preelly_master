import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  ViewStyle,
} from 'react-native';
import { PAYMENT_COLORS, paymentStyles } from '../../screens/payment/paymentStyles';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'link';
  style?: StyleProp<ViewStyle>;
}

export const PaymentButton = memo<Props>(
  ({ label, onPress, loading, disabled, variant = 'primary', style }) => {
    const isDisabled = disabled || loading;
    if (variant === 'link') {
      return (
        <Pressable
          onPress={onPress}
          disabled={isDisabled}
          style={[paymentStyles.linkBtn, isDisabled && paymentStyles.btnDisabled, style]}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={paymentStyles.linkBtnText}>{label}</Text>
        </Pressable>
      );
    }

    const isPrimary = variant === 'primary';
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          isPrimary ? paymentStyles.primaryBtn : paymentStyles.secondaryBtn,
          isDisabled && paymentStyles.btnDisabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#FFF' : PAYMENT_COLORS.primary} />
        ) : (
          <Text
            style={
              isPrimary
                ? paymentStyles.primaryBtnText
                : paymentStyles.secondaryBtnText
            }
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  },
);

PaymentButton.displayName = 'PaymentButton';
