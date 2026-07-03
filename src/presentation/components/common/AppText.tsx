import React, { memo } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import {
  helveticaNeue,
  typography,
  TypographyWeight,
} from '../../theme/typography';

export type AppTextVariant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  /** Predefined Helvetica Neue weight preset. */
  variant?: AppTextVariant;
  /** Override variant / apply a specific weight directly. */
  weight?: TypographyWeight;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * Typography-aware Text wrapper using Helvetica Neue.
 *
 * @example
 * <AppText style={pdStyles.sectionTitle}>Overview</AppText>
 * <AppText weight="700" style={{ fontSize: 16, color: '#111827' }}>Bold label</AppText>
 */
export const AppText = memo<AppTextProps>(
  ({ variant, weight, style, children, ...props }) => (
    <Text
      style={[
        variant ? typography[variant] : undefined,
        weight ? helveticaNeue(weight) : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  ),
);

AppText.displayName = 'AppText';
