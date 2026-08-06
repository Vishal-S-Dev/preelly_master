import { StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { fontText } from '../../../utils/fonts';

export const DRAFT_COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  primary: '#0000FF',
  danger: '#DC2626',
  thumbBg: '#F3F4F6',
};

export const draftsStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DRAFT_COLORS.bg },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minHeight: 48,
  },
  headerTitle: {
    ...fontText.semibold13,
    fontSize: 17,
    color: DRAFT_COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DRAFT_COLORS.border,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    ...fontText.semibold13,
    fontSize: 14,
    color: DRAFT_COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    ...fontText.regular12,
    fontSize: 12,
    color: DRAFT_COLORS.faint,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: DRAFT_COLORS.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: DRAFT_COLORS.card,
  },
  thumb: {
    width: 92,
    height: 78,
    borderRadius: 12,
    backgroundColor: DRAFT_COLORS.thumbBg,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    ...fontText.semibold13,
    fontSize: 14,
    color: DRAFT_COLORS.text,
  },
  cardCategory: {
    ...fontText.regular12,
    fontSize: 12,
    color: DRAFT_COLORS.muted,
    marginTop: 2,
  },
  cardPrice: {
    ...fontText.bold13,
    fontSize: 14,
    color: DRAFT_COLORS.text,
    marginTop: 4,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  continueLabel: {
    ...fontText.medium13,
    fontSize: 14,
    color: DRAFT_COLORS.muted,
    marginTop: 28,
    marginBottom: 14,
  },
});
