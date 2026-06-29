import React, { memo } from 'react';
import { Platform, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type GradientPriceBadgeSize = 'default' | 'compact';

interface GradientPriceBadgeProps {
  price: string | number;
  currency?: string;
  size?: GradientPriceBadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/** Matches reel / product price pill reference: blue → violet → magenta */
const GRADIENT_COLORS = ['#2B4BFF', '#6B2FFF', '#D927F5'] as const;
const GRADIENT_LOCATIONS = [0, 0.52, 1] as const;

const SIZE_STYLES: Record<
  GradientPriceBadgeSize,
  { wrapper: ViewStyle; text: TextStyle }
> = {
  default: {
    wrapper: {
      paddingHorizontal: 28,
      paddingVertical: Platform.OS === 'android' ? 12 : 13,
    },
    text: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  },
  compact: {
    wrapper: {
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'android' ? 8 : 9,
      flexShrink: 0,
      ...Platform.select({
        ios: {
          shadowColor: '#6B2FFF',
          shadowOpacity: 0.32,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 4 },
      }),
    },
    text: {
      fontSize: 14,
      lineHeight: Platform.OS === 'android' ? 20 : 18,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
  },
};

const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }
  const cleaned = String(price).replace(/,/g, '').trim();
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const formatPrice = (price: string | number): string => {
  const numeric = parsePrice(price);
  if (!Number.isFinite(numeric)) {
    return String(price);
  }

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const GradientPriceBadge = memo<GradientPriceBadgeProps>(
  ({ price, currency = 'AED', size = 'default', style, textStyle }) => {
    const sizeStyle = SIZE_STYLES[size];
    const label = `${currency} ${formatPrice(price)}`;

    return (
      <View style={[styles.wrapper, sizeStyle.wrapper, style]}>
        <LinearGradient
          colors={[...GRADIENT_COLORS]}
          locations={[...GRADIENT_LOCATIONS]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text
          style={[styles.text, sizeStyle.text, textStyle]}
          numberOfLines={1}
          allowFontScaling={false}>
          {label}
        </Text>
      </View>
    );
  },
);

GradientPriceBadge.displayName = 'GradientPriceBadge';

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    zIndex: 1,
  },
});

export default GradientPriceBadge;
