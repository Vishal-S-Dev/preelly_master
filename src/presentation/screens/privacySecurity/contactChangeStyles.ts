import { Platform, StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { OTP_COLORS, OTP_SPACING } from '../auth/verifyOtpScreenStyles';

export const contactChangeStyles = StyleSheet.create({
  /**
   * Unlike the OTP-entry screen (centered — brand + boxes + illustration all stacked
   * center), these "set a new contact value" screens keep the logo/tagline centered but
   * left-align the heading, subtitle, and form — matching the design reference.
   */
  headerSection: {
    alignItems: 'flex-start',
    width: '100%',
    marginTop: OTP_SPACING.xl,
    marginBottom: OTP_SPACING.xl,
  },
  title: {
    fontSize: wp('6.4%'),
    fontWeight: '800',
    color: OTP_COLORS.Title,
    textAlign: 'left',
    lineHeight: wp('7.6%'),
  },
  subtitle: {
    marginTop: OTP_SPACING.sm,
    fontSize: wp('3.6%'),
    lineHeight: wp('5.4%'),
    color: OTP_COLORS.subtitle,
    textAlign: 'left',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OTP_COLORS.inputBorder,
    borderRadius: wp('4%'),
    backgroundColor: OTP_COLORS.inputBg,
    paddingHorizontal: 16,
    minHeight: hp('7%'),
  },
  inputRowFocused: {
    borderColor: OTP_COLORS.inputBorderFocus,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: wp('3.9%'),
    color: OTP_COLORS.heading,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  phoneInputDivider: {
    marginHorizontal: 8,
    color: OTP_COLORS.placeholder,
  },
  submitWrap: {
    marginTop: OTP_SPACING.xl,
  },
  backLink: {
    marginTop: OTP_SPACING.lg,
    alignSelf: 'center',
    color: OTP_COLORS.primary,
    fontWeight: '700',
    fontSize: wp('3.6%'),
  },
});
