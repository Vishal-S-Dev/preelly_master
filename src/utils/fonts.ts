import { Platform, TextStyle } from 'react-native';

/**
 * Noto Sans weights — filenames in `assets/fonts` use lowercase + underscore
 * (e.g. `notosans_bold.ttf`). Use these helpers anywhere for consistent type.
 */
export type AppFontWeight =
  | 'thin'
  | 'extralight'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';

/** Android / linked asset basenames (no extension). */
export const APP_FONT_FILES = {
  thin: 'notosans_thin',
  extralight: 'notosans_extralight',
  light: 'notosans_light',
  regular: 'notosans_regular',
  medium: 'notosans_medium',
  semibold: 'notosans_semibold',
  bold: 'notosans_bold',
  extrabold: 'notosans_extrabold',
  black: 'notosans_black',
} as const satisfies Record<AppFontWeight, string>;

/**
 * iOS PostScript names (nameID 6) from the TTF files — verified via font metadata.
 * Regular/Bold share family "Noto Sans"; always use PostScript for the correct face.
 */
const APP_FONT_IOS = {
  thin: 'NotoSans-Thin',
  extralight: 'NotoSans-ExtraLight',
  light: 'NotoSans-Light',
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semibold: 'NotoSans-SemiBold',
  bold: 'NotoSans-Bold',
  extrabold: 'NotoSans-ExtraBold',
  black: 'NotoSans-Black',
} as const satisfies Record<AppFontWeight, string>;

/** Resolves the correct `fontFamily` for the active platform. */
export const appFontFamily = (weight: AppFontWeight = 'regular'): string =>
  Platform.select({
    ios: APP_FONT_IOS[weight],
    android: APP_FONT_FILES[weight],
    default: APP_FONT_FILES[weight],
  }) as string;

export type AppFontOptions = {
  /** Optional letter spacing for premium polish. */
  letterSpacing?: number;
  /** Optional line height (defaults when size is set for light body text). */
  lineHeight?: number;
};

/**
 * Build a reusable text style from weight + size.
 * Do not combine with React Native `fontWeight` when using dedicated TTF faces.
 *
 * @example
 * <Text style={[appFont('bold', 13), { color: '#111' }]}>Username</Text>
 * <Text style={appFont('light', 15)}>Comment body</Text>
 */
export const appFont = (
  weight: AppFontWeight = 'regular',
  fontSize?: number,
  options?: AppFontOptions,
): TextStyle => {
  const style: TextStyle = {
    fontFamily: appFontFamily(weight),
  };

  if (typeof fontSize === 'number') {
    style.fontSize = fontSize;
  }
  if (typeof options?.letterSpacing === 'number') {
    style.letterSpacing = options.letterSpacing;
  }
  if (typeof options?.lineHeight === 'number') {
    style.lineHeight = options.lineHeight;
  }

  return style;
};

/**
 * Ready-made presets used across the app (comments, cards, etc.).
 * Prefer these when matching design-system specs.
 */
export const fontText = {
  /** Username / compact labels — Bold 13 */
  bold13: appFont('bold', 13, { letterSpacing: -0.1 }),
  /** Comment / body copy — Light 15 */
  light15: appFont('light', 15, { lineHeight: 21, letterSpacing: -0.05 }),
  /** Secondary meta (time, counts) — Regular 12 */
  regular12: appFont('regular', 12),
  /** Secondary meta (time, counts) — Regular 12 */
  regular15: appFont('regular', 15),
  /** Secondary meta — Medium 12 */
  medium12: appFont('medium', 12),
  /** Emphasis — SemiBold 13 */
  semibold13: appFont('semibold', 13),
  /** Section titles — Bold 16 */
  bold16: appFont('bold', 16, { letterSpacing: -0.2 }),
  /** Dense UI labels — Medium 13 */
  medium13: appFont('medium', 13),
} as const;

/** Convenience aliases matching weight names for spread into StyleSheets. */
export const fonts = {
  thin: () => appFont('thin'),
  extralight: () => appFont('extralight'),
  light: () => appFont('light'),
  regular: () => appFont('regular'),
  medium: () => appFont('medium'),
  semibold: () => appFont('semibold'),
  bold: () => appFont('bold'),
  extrabold: () => appFont('extrabold'),
  black: () => appFont('black'),
} as const;
