import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export const ONBOARDING_COLORS = {
  skip: 'rgba(255,255,255,0.92)',
  title: '#FFFFFF',
  description: 'rgba(255,255,255,0.88)',
  iconCircle: 'rgba(255,255,255,0.18)',
  icon: '#FFFFFF',
  dotInactive: 'rgba(255,255,255,0.38)',
  dotActive: '#FFFFFF',
  footerBg: 'transparent',
};

export const onboardingScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7C3AED',
  },
  skipBtn: {
    position: 'absolute',
    right: wp('5%'),
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    color: ONBOARDING_COLORS.skip,
    fontSize: 16,
    fontWeight: '600',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  iconWrap: {
    width: wp('34%'),
    height: wp('34%'),
    borderRadius: wp('17%'),
    backgroundColor: ONBOARDING_COLORS.iconCircle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('4%'),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    color: ONBOARDING_COLORS.title,
    fontSize: wp('7.2%'),
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: wp('9%'),
    letterSpacing: -0.3,
    marginBottom: hp('1.8%'),
  },
  description: {
    color: ONBOARDING_COLORS.description,
    fontSize: wp('4.1%'),
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: wp('6%'),
    maxWidth: wp('82%'),
  },
  footer: {
    paddingHorizontal: wp('6%'),
    paddingTop: hp('1.2%'),
    gap: hp('2.4%'),
    backgroundColor: ONBOARDING_COLORS.footerBg,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 10,
  },
  ctaWrap: {
    width: '100%',
  },
});
