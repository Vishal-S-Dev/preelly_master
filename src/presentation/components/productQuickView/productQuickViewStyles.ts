import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export const QV_COLORS = {
  sheetBg: '#FFFFFF',
  handle: '#D1D5DB',
  title: '#111827',
  subtitle: '#6B7280',
  priceBg: '#0026FF',
  priceText: '#FFFFFF',
  statPillBg: '#F3F4F6',
  statText: '#374151',
  availableBg: '#22C55E',
  availableText: '#FFFFFF',
  specLabel: '#9CA3AF',
  specValue: '#111827',
  divider: '#E5E7EB',
  callBg: '#E8F1FF',
  callIcon: '#2563EB',
  whatsappBg: '#E8F8EF',
  whatsappIcon: '#16A34A',
  chatBg: '#EFE9FF',
  chatIcon: '#5B21B6',
  badgeOverlay: 'rgba(0,0,0,0.55)',
};

export const qvStyles = StyleSheet.create({
  handleWrap: {
    alignItems: 'center',
    paddingTop: hp('1.2%'),
    paddingBottom: hp('1%'),
  },
  handle: {
    width: wp('12%'),
    height: hp('0.55%'),
    borderRadius: 100,
    backgroundColor: QV_COLORS.handle,
  },
  scrollContent: {
    paddingBottom: hp('12%'),
  },
  carouselWrap: {
    width: '100%',
    marginBottom: hp('1.6%'),
  },
  carouselImage: {
    width: wp('100%'),
    height: hp('24%'),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  imageBadge: {
    position: 'absolute',
    top: hp('1.2%'),
    right: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: QV_COLORS.badgeOverlay,
    borderWidth: 1,
    borderColor: QV_COLORS.statText,
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('4%'),
    gap: 4,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1.8%'),
    gap: wp('2%'),
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: QV_COLORS.statPillBg,
    borderRadius: wp('5%'),
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.7%'),
    gap: 4,
  },
  statPillText: {
    fontSize: wp('3.1%'),
    fontWeight: '700',
    color: QV_COLORS.statText,
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('10%'),
    backgroundColor: QV_COLORS.statPillBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1.2%'),
    gap: wp('2%'),
  },
  title: {
    flex: 1,
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: QV_COLORS.title,
    lineHeight: wp('6%'),
  },
  pricePill: {
    backgroundColor: QV_COLORS.priceBg,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
  },
  priceText: {
    color: QV_COLORS.priceText,
    fontSize: wp('3.2%'),
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1.2%'),
    gap: wp('3%'),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: wp('3%'),
    color: QV_COLORS.subtitle,
    fontWeight: '500',
  },
  availablePill: {
    backgroundColor: QV_COLORS.availableBg,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.35%'),
    marginLeft: 'auto',
  },
  availableText: {
    color: QV_COLORS.availableText,
    fontSize: wp('2.8%'),
    fontWeight: '700',
  },
  seenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1.6%'),
  },
  seenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp('2%'),
  },
  seenAvatar: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
  },
  seenText: {
    flex: 1,
    fontSize: wp('3%'),
    color: QV_COLORS.subtitle,
    fontWeight: '500',
  },
  seenBold: {
    fontWeight: '800',
    color: QV_COLORS.title,
  },
  postedText: {
    fontSize: wp('2.8%'),
    color: QV_COLORS.subtitle,
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: '42%',
  },
  section: {
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1.8%'),
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: hp('0.8%'),
  },
  sectionHeading: {
    fontSize: wp('3.6%'),
    fontWeight: '800',
    color: QV_COLORS.title,
  },
  addressText: {
    fontSize: wp('3.2%'),
    lineHeight: wp('4.6%'),
    color: QV_COLORS.subtitle,
    fontWeight: '500',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    gap: wp('4%'),
  },
  specCell: {
    width: '47%',
    marginBottom: hp('1%'),
  },
  specLabel: {
    fontSize: wp('3%'),
    color: QV_COLORS.specLabel,
    fontWeight: '500',
    marginBottom: 2,
  },
  specValue: {
    fontSize: wp('3.4%'),
    color: QV_COLORS.specValue,
    fontWeight: '800',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.2%'),
    paddingBottom: Platform.OS === 'ios' ? hp('2.5%') : hp('1.8%'),
    gap: wp('3%'),
    backgroundColor: QV_COLORS.sheetBg,
    borderTopWidth: 1,
    borderTopColor: QV_COLORS.divider,
  },
  actionBtn: {
    flex: 1,
    minHeight: hp('5.8%'),
    borderRadius: wp('16%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const formatCompactCount = (value: number): string => {
  if (value >= 1000) {
    const compact = value / 1000;
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}K`;
  }
  return String(value);
};
