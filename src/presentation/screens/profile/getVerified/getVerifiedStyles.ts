import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export const GV_COLORS = {
  bg: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  dashed: '#93C5FD',
  danger: '#DC2626',
};

export const gvStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GV_COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GV_COLORS.border,
  },
  headerTitle: { fontSize: wp('4.8%'), fontWeight: '800', color: GV_COLORS.text },
  headerBtn: { width: wp('10%'), height: wp('10%'), alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: wp('4.5%'), paddingTop: hp('2%'), paddingBottom: hp('14%') },
  sectionTitle: {
    fontSize: wp('4.6%'),
    fontWeight: '800',
    color: GV_COLORS.text,
    marginBottom: hp('2%'),
  },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: GV_COLORS.dashed,
    borderRadius: 16,
    aspectRatio: 1.58,
    marginBottom: hp('2%'),
    overflow: 'hidden',
    backgroundColor: '#FAFBFF',
  },
  uploadCardEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  uploadCardLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: GV_COLORS.muted,
    marginTop: 10,
  },
  uploadCardHint: {
    fontSize: wp('3.1%'),
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: wp('4.4%'),
  },
  uploadCardFilled: {
    flex: 1,
    padding: 12,
  },
  uploadPreview: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  uploadPreviewImage: {
    width: '100%',
    height: '100%',
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  deleteAction: {
    color: GV_COLORS.danger,
    fontWeight: '700',
    fontSize: wp('3.6%'),
  },
  retakeAction: {
    color: GV_COLORS.primary,
    fontWeight: '700',
    fontSize: wp('3.6%'),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.2%'),
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GV_COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -3 },
      },
      android: { elevation: 8 },
    }),
  },
  submitBtn: {
    backgroundColor: GV_COLORS.primary,
    borderRadius: 999,
    paddingVertical: hp('1.9%'),
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: wp('4.2%') },
});
