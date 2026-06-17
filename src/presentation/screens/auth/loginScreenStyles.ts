import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export const AUTH_COLORS = {
  gradientStart: '#1E00FF',
  gradientEnd: '#C400FF',
  cardBg: '#FFFFFF',
  heading: '#0B1534',
  subtitle: '#5B6F8E',
  sectionTitle: '#111827',
  inputBg: '#F4F6FB',
  inputBorder: '#D8E0EF',
  inputBorderFocus: '#1E4DFF',
  placeholder: '#9AA8BC',
  primaryButton: '#0026FF',
  dividerText: '#7A8DA8',
  dividerLine: '#E2E8F0',
  guestText: '#6B7C94',
  error: '#DC2626',
  icon: '#8B9AB5',
};

export const AUTH_SPACING = {
  xs: hp('0.6%'),
  sm: hp('1%'),
  md: hp('1.6%'),
  lg: hp('2.2%'),
  xl: hp('3%'),
};

export const AUTH_RADIUS = {
  input: wp('3.5%'),
  card: wp('7%'),
  button: wp('12%'),
  social: wp('12%'),
};

export const loginScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_COLORS.gradientEnd,
  },
  headerSection: {
    flex: 0.25,

    minHeight: hp('28%'),
    maxHeight: hp('46%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('0%'),
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slogan: {
    position: 'absolute',
    top: 1,
    bottom: 0,
    flex: 1,
    alignSelf: 'center',
  },
  cardSection: {
    flex: 0.75,
    minHeight: hp('52%'),
    marginTop: -10,
  },
  card: {
    flex: 1,
    backgroundColor: AUTH_COLORS.cardBg,
    borderTopLeftRadius: AUTH_RADIUS.card,
    borderTopRightRadius: AUTH_RADIUS.card,
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('2%'),
    ...Platform.select({
      ios: {
        shadowColor: '#0B1534',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('3%'),
  },
  welcomeTitle: {
    fontSize: wp('7.5%'),
    fontWeight: '800',
    color: AUTH_COLORS.heading,
    lineHeight: wp('9%'),
  },
  welcomeSubtitle: {
    marginTop: AUTH_SPACING.xs,
    fontSize: wp('3.6%'),
    lineHeight: wp('5%'),
    color: AUTH_COLORS.subtitle,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: AUTH_SPACING.lg,
    marginBottom: AUTH_SPACING.md,
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: AUTH_COLORS.sectionTitle,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: AUTH_RADIUS.input,
    paddingHorizontal: wp('3.5%'),
    minHeight: hp('6.9%'),
    marginBottom: AUTH_SPACING.md,
  },
  inputRowFocused: {
    borderColor: AUTH_COLORS.inputBorderFocus,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: wp('2.5%'),
  },
  input: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: AUTH_COLORS.heading,
    paddingVertical: Platform.OS === 'ios' ? hp('1.4%') : hp('1%'),
  },
  otpButton: {
    alignSelf: 'flex-start',
    paddingVertical: AUTH_SPACING.xs,
    marginBottom: AUTH_SPACING.sm,
  },
  otpButtonText: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: AUTH_COLORS.primaryButton,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: AUTH_SPACING.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.dividerLine,
  },
  orText: {
    marginHorizontal: wp('3%'),
    fontSize: wp('3.4%'),
    fontWeight: '700',
    color: AUTH_COLORS.dividerText,
  },
  toggleText: {
    alignSelf: 'flex-end',
    marginTop: -AUTH_SPACING.sm,
    marginBottom: AUTH_SPACING.md,
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: AUTH_COLORS.primaryButton,
  },
  primaryButtonWrap: {
    marginTop: AUTH_SPACING.sm,
    borderRadius: AUTH_RADIUS.button,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: AUTH_COLORS.primaryButton,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButton: {
    borderRadius: AUTH_RADIUS.button,
    minHeight: hp('6.4%'),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4.2%'),
    fontWeight: '800',
  },
  errorText: {
    marginTop: AUTH_SPACING.sm,
    marginBottom: AUTH_SPACING.sm,
    fontSize: wp('3.4%'),
    fontWeight: '600',
    color: AUTH_COLORS.error,
    textAlign: 'center',
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AUTH_SPACING.lg,
    marginBottom: AUTH_SPACING.lg,
  },
  socialDividerText: {
    marginHorizontal: wp('2.5%'),
    fontSize: wp('3.2%'),
    color: AUTH_COLORS.dividerText,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('6%'),
    marginBottom: AUTH_SPACING.lg,
  },
  socialButton: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: AUTH_RADIUS.social,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.dividerLine,
    ...Platform.select({
      ios: {
        shadowColor: '#0B1534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  guestButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AUTH_SPACING.sm,
    paddingHorizontal: wp('2%'),
  },
  guestText: {
    fontSize: wp('3.6%'),
    fontWeight: '600',
    color: AUTH_COLORS.guestText,
  },
  registerText: {
    fontSize: wp('3.9%'),
    fontWeight: '600',
    color: AUTH_COLORS.primaryButton,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
    marginBottom: 16,
  },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: AUTH_RADIUS.input,
    paddingHorizontal: wp('3.5%'),
    minHeight: hp('6.9%'),
    marginBottom: AUTH_SPACING.md,
  },
  flag: {
    fontSize: 18,
  },

  code: {
    marginLeft: 5,
    fontWeight: '500',
    color: '#919BBA',
  },
  inputBoxMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: AUTH_RADIUS.input,
    paddingHorizontal: wp('3.5%'),
    minHeight: hp('6.9%'),
    marginBottom: AUTH_SPACING.md,
  },
});
