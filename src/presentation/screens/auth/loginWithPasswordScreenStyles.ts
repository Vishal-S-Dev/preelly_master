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
  error: '#E53935',
  icon: '#8B9AB5',
  link: '#1E4DFF',
};

export const AUTH_SPACING = {
  xs: hp('0.5%'),
  sm: hp('0.9%'),
  md: hp('1.4%'),
  lg: hp('2%'),
  xl: hp('2.8%'),
};

export const AUTH_RADIUS = {
  input: wp('3.2%'),
  card: wp('8%'),
  button: wp('12%'),
  social: wp('12%'),
};

export const loginWithPasswordStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_COLORS.gradientEnd,
  },
  headerSection: {
    flex: 0.42,
    minHeight: hp('26%'),
    maxHeight: hp('45%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSection: {
    flex: 0.58,
    minHeight: hp('54%'),
  },
  card: {
    flex: 1,
    backgroundColor: AUTH_COLORS.cardBg,
    borderTopLeftRadius: AUTH_RADIUS.card,
    borderTopRightRadius: AUTH_RADIUS.card,
    paddingHorizontal: wp('6%'),
    paddingTop: hp('2.8%'),
    paddingBottom: hp('1.5%'),
    ...Platform.select({
      ios: {
        shadowColor: '#0B1534',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('4%'),
  },
  welcomeTitle: {
    fontSize: wp('7.2%'),
    fontWeight: '800',
    color: AUTH_COLORS.heading,
    lineHeight: wp('8.8%'),
  },
  welcomeSubtitle: {
    marginTop: AUTH_SPACING.xs,
    fontSize: wp('3.5%'),
    lineHeight: wp('5%'),
    color: AUTH_COLORS.subtitle,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: AUTH_SPACING.lg,
    marginBottom: AUTH_SPACING.md,
    fontSize: wp('4.6%'),
    fontWeight: '800',
    color: AUTH_COLORS.sectionTitle,
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: -AUTH_SPACING.xs,
    marginBottom: AUTH_SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: AUTH_COLORS.link,
  },
  primaryButtonWrap: {
    marginTop: AUTH_SPACING.sm,
    borderRadius: AUTH_RADIUS.button,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: AUTH_COLORS.primaryButton,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.32,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButton: {
    borderRadius: AUTH_RADIUS.button,
    minHeight: hp('6.2%'),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4.1%'),
    fontWeight: '800',
  },
  apiErrorText: {
    marginTop: AUTH_SPACING.sm,
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: AUTH_COLORS.error,
    textAlign: 'center',
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AUTH_SPACING.xl,
    marginBottom: AUTH_SPACING.lg,
  },
  socialDividerText: {
    marginHorizontal: wp('2%'),
    fontSize: wp('3.1%'),
    color: AUTH_COLORS.dividerText,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.dividerLine,
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
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: AUTH_COLORS.guestText,
  },
});

export const authInputStyles = StyleSheet.create({
  fieldWrap: {
    marginBottom: AUTH_SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: AUTH_RADIUS.input,
    paddingHorizontal: wp('3.5%'),
    minHeight: hp('6%'),
  },
  inputRowError: {
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: wp('2.5%'),
  },
  trailingIcon: {
    marginLeft: wp('2%'),
  },
  input: {
    flex: 1,
    fontSize: wp('3.7%'),
    color: AUTH_COLORS.heading,
    paddingVertical: Platform.OS === 'ios' ? hp('1.3%') : hp('0.9%'),
  },
  fieldError: {
    marginTop: AUTH_SPACING.xs,
    fontSize: wp('3%'),
    color: AUTH_COLORS.error,
    fontWeight: '500',
  },
});
