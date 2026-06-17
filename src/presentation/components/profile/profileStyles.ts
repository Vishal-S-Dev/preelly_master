import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { AppTheme } from '../../theme/colors';

export const PROFILE_GRID_GAP = 2;

export const getProfileTheme = (theme: AppTheme) => ({
  bg: theme.background,
  text: theme.text,
  muted: theme.subText,
  pillBg: theme.card,
  pillText: theme.primary,
  actionBg: theme.card,
  actionText: theme.primary,
  primary: theme.primary,
  star: '#FBBF24',
  divider: `${theme.subText}33`,
  gridGap: PROFILE_GRID_GAP,
  verified: theme.primary,
  avatarPlaceholder: theme.card,
  avatarRing: `${theme.subText}44`,
  bio: theme.subText,
  ratingDivider: `${theme.subText}55`,
  skeleton: theme.card,
  editBadgeBg: theme.text,
  iconMuted: theme.subText,
  danger: theme.danger,
});

export type ProfileTheme = ReturnType<typeof getProfileTheme>;

export const getProfileStyles = (theme: AppTheme) => {
  const c = getProfileTheme(theme);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    headerBlock: {
      alignItems: 'center',
      paddingHorizontal: wp('5%'),
      paddingTop: hp('1.5%'),
      paddingBottom: hp('1%'),
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: hp('1.2%'),
    },
    avatarRing: {
      padding: 3,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.avatarRing,
    },
    avatar: {
      width: wp('24%'),
      height: wp('24%'),
      borderRadius: wp('12%'),
      backgroundColor: c.avatarPlaceholder,
    },
    editBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: wp('7%'),
      height: wp('7%'),
      borderRadius: wp('3.5%'),
      backgroundColor: c.editBadgeBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.bg,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontSize: wp('5%'),
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
    },
    ratingPill: {
      marginTop: hp('1%'),
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.pillBg,
      borderRadius: 999,
      paddingHorizontal: wp('4%'),
      paddingVertical: hp('0.7%'),
      gap: 8,
    },
    ratingValue: {
      fontSize: wp('3.5%'),
      fontWeight: '700',
      color: c.text,
    },
    ratingDivider: {
      width: 1,
      height: hp('1.6%'),
      backgroundColor: c.ratingDivider,
    },
    ratingCount: {
      fontSize: wp('3.3%'),
      color: c.muted,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      width: '100%',
      marginTop: hp('2%'),
      marginBottom: hp('1.6%'),
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: wp('4.4%'),
      fontWeight: '800',
      color: c.text,
    },
    statLabel: {
      marginTop: 4,
      fontSize: wp('3%'),
      color: c.muted,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp('2.5%'),
      width: '100%',
      marginBottom: hp('1.4%'),
    },
    actionPill: {
      flex: 1,
      backgroundColor: c.actionBg,
      borderRadius: 999,
      paddingVertical: hp('1.2%'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPillText: {
      color: c.actionText,
      fontWeight: '700',
      fontSize: wp('3.5%'),
    },
    moreBtn: {
      width: wp('11%'),
      height: wp('11%'),
      borderRadius: wp('5.5%'),
      backgroundColor: c.actionBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bio: {
      textAlign: 'center',
      color: c.bio,
      fontSize: wp('3.5%'),
      lineHeight: wp('5%'),
      marginBottom: hp('1.2%'),
    },
    tabsRow: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
      backgroundColor: c.bg,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: hp('1.4%'),
      position: 'relative',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 3,
      width: wp('16%'),
      borderRadius: 3,
      backgroundColor: c.primary,
    },
    gridContent: {
      paddingBottom: hp('12%'),
    },
    gridRow: {
      gap: c.gridGap,
      marginBottom: c.gridGap,
    },
    emptyWrap: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: hp('8%'),
      paddingHorizontal: wp('8%'),
    },
    emptyTitle: {
      marginTop: hp('1.5%'),
      fontSize: wp('4.2%'),
      fontWeight: '700',
      color: c.text,
    },
    emptySubtitle: {
      marginTop: hp('0.8%'),
      fontSize: wp('3.5%'),
      color: c.muted,
      textAlign: 'center',
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: c.gridGap,
      padding: c.gridGap,
    },
    skeletonCell: {
      backgroundColor: c.skeleton,
    },
    footerLoader: {
      paddingVertical: hp('2%'),
    },
    moreMenuOverlay: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 8 },
      }),
    },
    visitorTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    visitorBackBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.pillBg,
    },
    visitorShareBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.actionBg,
    },
    visitorShareBtnText: {
      color: c.actionText,
      fontWeight: '700',
      fontSize: 14,
    },
    visitorErrorText: {
      color: theme.danger,
      textAlign: 'center',
      marginBottom: 8,
      fontSize: 13,
    },
    pillSecondary: {
      backgroundColor: c.avatarRing,
    },
    pillSecondaryText: {
      color: c.text,
    },
    photoSheetBg: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    photoSheetContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    photoSheetAction: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: c.actionBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 12,
    },
    photoSheetActionText: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
    },
    photoSheetCancel: {
      justifyContent: 'center',
      backgroundColor: c.actionBg,
    },
    photoSheetCancelText: {
      color: c.text,
      fontSize: 15,
      fontWeight: '700',
      width: '100%',
      textAlign: 'center',
    },
  });
};

export type ProfileStyles = ReturnType<typeof getProfileStyles>;

/** @deprecated Use useProfileStyles() — kept for gradual migration */
export const PF_COLORS = {
  bg: '#FFFFFF',
  text: '#111827',
  muted: '#9CA3AF',
  pillBg: '#F3F4F6',
  pillText: '#1E3A8A',
  actionBg: '#EEF2FF',
  actionText: '#1E40AF',
  primary: '#2563EB',
  star: '#FBBF24',
  divider: '#F3F4F6',
  gridGap: PROFILE_GRID_GAP,
  verified: '#2563EB',
};
