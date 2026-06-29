import { Platform, StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { AppTheme } from '../../theme/colors';

export const getSettingsTheme = (theme: AppTheme) => ({
  bg: theme.background,
  text: theme.text,
  muted: theme.subText,
  primary: theme.primary,
  border: '#E5E7EB',
  card: theme.background,
  danger: theme.danger,
  skeleton: theme.card,
  dashed: '#93C5FD',
});

export type SettingsTheme = ReturnType<typeof getSettingsTheme>;

export const getSettingsStyles = (theme: AppTheme) => {
  const c = getSettingsTheme(theme);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 8,
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
    },
    scrollContent: {
      paddingBottom: hp('4%'),
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.skeleton,
    },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#111827',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.bg,
    },
    profileMeta: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
    },
    verifiedCard: {
      marginTop: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.dashed,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'flex-start',
    },
    verifiedText: {
      color: c.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingTop: 18,
      gap: 12,
    },
    gridCard: {
      width: '48%',
      minHeight: 108,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      backgroundColor: c.card,
      paddingVertical: 16,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 1 },
      }),
    },
    gridTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    gridCount: {
      fontSize: 13,
      fontWeight: '600',
      color: c.muted,
      marginTop: 2,
    },
    menuSection: {
      marginTop: 22,
      paddingHorizontal: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 14,
    },
    menuIconWrap: {
      width: 28,
      alignItems: 'center',
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    menuChevron: {
      opacity: 0.45,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginHorizontal: 20,
      marginTop: 6,
    },
    logoutItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 14,
      marginTop: 4,
    },
    logoutLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.danger,
    },
    versionText: {
      textAlign: 'center',
      color: c.muted,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 24,
      marginBottom: 8,
    },
    skeletonName: {
      width: wp('40%'),
      height: 22,
      borderRadius: 8,
      backgroundColor: c.skeleton,
    },
    skeletonVerified: {
      marginTop: 10,
      width: wp('42%'),
      height: 40,
      borderRadius: 12,
      backgroundColor: c.skeleton,
    },
    skeletonGridCard: {
      width: '48%',
      height: 108,
      borderRadius: 14,
      backgroundColor: c.skeleton,
    },
  });
};

export type SettingsStyles = ReturnType<typeof getSettingsStyles>;
