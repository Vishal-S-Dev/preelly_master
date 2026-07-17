import { Platform, TextStyle } from 'react-native';
import { appFont, fontText, fonts, type AppFontWeight } from '../../utils/fonts';

export type { AppFontWeight };
export { appFont, fontText, fonts };

/** Supported Helvetica Neue weights for cross-platform text styles. */
export type TypographyWeight = '400' | '500' | '600' | '700' | '800';

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const satisfies Record<string, TypographyWeight>;

export const FONT_FAMILY = {
  helveticaNeue: 'Helvetica Neue',
} as const;

const IOS_HELVETICA_NEUE: Record<TypographyWeight, string> = {
  '400': 'HelveticaNeue',
  '500': 'HelveticaNeue-Medium',
  '600': 'HelveticaNeue-Medium',
  '700': 'HelveticaNeue-Bold',
  '800': 'HelveticaNeue-Bold',
};

/**
 * Returns Helvetica Neue font styles for the given weight.
 * Prefer `appFont` / `fontText` from `src/utils/fonts` for Noto Sans brand type.
 *
 * @example
 * StyleSheet.create({
 *   title: { ...helveticaNeue('700'), fontSize: 18, color: '#111827' },
 * })
 */
export const helveticaNeue = (
  weight: TypographyWeight = FONT_WEIGHT.regular,
): Pick<TextStyle, 'fontFamily' | 'fontWeight'> =>
  Platform.select({
    ios: {
      fontFamily: IOS_HELVETICA_NEUE[weight],
      fontWeight: weight,
    },
    android: {
      fontFamily: Number(weight) >= 600 ? 'sans-serif-medium' : 'sans-serif',
      fontWeight: weight,
    },
    default: {
      fontFamily: FONT_FAMILY.helveticaNeue,
      fontWeight: weight,
    },
  }) ?? {
    fontFamily: FONT_FAMILY.helveticaNeue,
    fontWeight: weight,
  };

/** Reusable Helvetica presets — legacy; prefer `fontText` for new UI. */
export const typography = {
  regular: helveticaNeue(FONT_WEIGHT.regular),
  medium: helveticaNeue(FONT_WEIGHT.medium),
  semibold: helveticaNeue(FONT_WEIGHT.semibold),
  bold: helveticaNeue(FONT_WEIGHT.bold),
  heavy: helveticaNeue(FONT_WEIGHT.heavy),
} as const;
