import { StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { PE_COLORS } from '../profile/edit/profileEditStyles';

export const psStyles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
    marginTop: hp('0.6%'),
  },
  toggleLabel: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: PE_COLORS.text,
  },
  hintText: {
    fontSize: wp('3.2%'),
    color: PE_COLORS.muted,
    marginTop: -2,
    marginBottom: hp('1%'),
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1.4%'),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PE_COLORS.border,
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialLabel: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: PE_COLORS.text,
  },
  socialUnlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialUnlinkText: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: PE_COLORS.primary,
  },
});
