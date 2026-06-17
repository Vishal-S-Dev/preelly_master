import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export const OTP_COLORS = {
  background: '#FFFFFF',
  heading: '#0B1534',
  subtitle: '#6B7C94',
  emailHighlight: '#0B1534',
  primary: '#0026FF',
  primaryGradientEnd: '#1E4DFF',
  inputBg: '#F7F8FC',
  inputBorder: '#D8E0EF',
  inputBorderFocus: '#1E4DFF',
  inputBorderError: '#E53935',
  placeholder: '#B8C4D6',
  divider: '#E2E8F0',
  resendMuted: '#9AA8BC',
  error: '#E53935',
  tagline: '#1E4DFF',
  Title: '#232388',
};

export const OTP_SPACING = {
  xs: hp('0.5%'),
  sm: hp('0.9%'),
  md: hp('1.4%'),
  lg: hp('2%'),
  xl: hp('2.8%'),
};

export const OTP_RADIUS = {
  box: wp('2.8%'),
  button: wp('12%'),
};

export const verifyOtpStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OTP_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingBottom: hp('4%'),
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: hp('1%'),
    marginBottom: OTP_SPACING.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: OTP_SPACING.md,
  },
  title: {
    fontSize: wp('5.8%'),
    fontWeight: '800',
    color: OTP_COLORS.Title,
    textAlign: 'center',
    lineHeight: wp('7.2%'),
  },
  subtitle: {
    marginTop: OTP_SPACING.sm,
    fontSize: wp('3.5%'),
    lineHeight: wp('5.2%'),
    color: OTP_COLORS.subtitle,
    textAlign: 'center',
    fontWeight: '500',
  },
  emailBold: {
    fontWeight: '800',
    color: OTP_COLORS.Title,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: OTP_SPACING.md,
    width: '100%',
  },
  resendWrap: {
    alignItems: 'center',
    marginBottom: OTP_SPACING.xl,
  },
  resendText: {
    fontSize: wp('3.6%'),
    color: OTP_COLORS.resendMuted,
    fontWeight: '500',
  },
  resendTimer: {
    color: OTP_COLORS.primary,
    fontWeight: '700',
  },
  resendActive: {
    fontSize: wp('3.6%'),
    color: OTP_COLORS.primary,
    fontWeight: '700',
  },
  primaryButtonWrap: {
    borderRadius: OTP_RADIUS.button,
    overflow: 'hidden',
    marginBottom: OTP_SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: OTP_COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButton: {
    minHeight: hp('6.2%'),
    borderRadius: OTP_RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4.1%'),
    fontWeight: '800',
  },
  errorText: {
    marginBottom: OTP_SPACING.md,
    fontSize: wp('3.2%'),
    color: OTP_COLORS.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  helperText: {
    marginBottom: OTP_SPACING.sm,
    fontSize: wp('3%'),
    color: OTP_COLORS.resendMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: OTP_SPACING.xl,
  },
  bottomMuted: {
    fontSize: wp('3.4%'),
    color: OTP_COLORS.resendMuted,
    fontWeight: '500',
  },
  bottomEmail: {
    marginTop: OTP_SPACING.xs,
    fontSize: wp('3.5%'),
    color: OTP_COLORS.subtitle,
    fontWeight: '600',
    textAlign: 'center',
  },
  changeLink: {
    marginTop: OTP_SPACING.sm,
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: OTP_COLORS.primary,
  },
});

export const otpBoxStyles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2.2%'),
    marginTop: OTP_SPACING.lg,
    marginBottom: OTP_SPACING.lg,
  },
  box: {
    width: wp('12%'),
    maxWidth: 56,
    minWidth: 44,
    aspectRatio: 1,
    borderRadius: OTP_RADIUS.box,
    borderWidth: 1,
    borderColor: OTP_COLORS.inputBorder,
    backgroundColor: OTP_COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFocused: {
    borderColor: OTP_COLORS.inputBorderFocus,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  boxFilled: {
    borderColor: OTP_COLORS.inputBorderFocus,
    backgroundColor: '#FFFFFF',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: wp('5%'),
    fontWeight: '700',
    color: OTP_COLORS.heading,
    padding: 0,
  },
  placeholder: {
    fontSize: wp('5%'),
    color: OTP_COLORS.placeholder,
    fontWeight: '600',
  },
});
