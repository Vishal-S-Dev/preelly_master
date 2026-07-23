import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/colors';

/** Semantic accents that stay consistent across light/dark. */
export const CHAT_ACCENT = {
  onlineGreen: '#22C55E',
  notificationRed: '#EF4444',
} as const;

const AVATAR_SIZE = 56;
const PRODUCT_CIRCLE = AVATAR_SIZE;
const OVERLAP_AVATAR = 32;

export const getChatScreenStyles = (theme: AppTheme) => {
  const divider = theme.subText + '33';
  const chipBorder = theme.subText + '44';
  const placeholder = theme.card;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      justifyContent: 'space-between',
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 8,
    },
    headerAvatarWrap: {
      position: 'relative',
      marginRight: 10,
    },
    headerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: placeholder,
    },
    headerAvatarNotifyDot: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: CHAT_ACCENT.notificationRed,
      borderWidth: 2,
      borderColor: theme.background,
    },
    headerTitles: {
      flexShrink: 1,
      alignItems: 'flex-start',
    },
    headerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerName: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginRight: 4,
      maxWidth: 180,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.subText,
      marginTop: 2,
    },
    verifiedIcon: {
      marginLeft: 2,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 8,
      paddingBottom: 12,
    },
    toolbarWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
      overflow: 'hidden',
    },
    searchSlot: {
      paddingHorizontal: 16,
      overflow: 'hidden',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: chipBorder,
      backgroundColor: theme.background,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 10,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 0,
    },
    searchCloseBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterScroll: {
      flex: 1,
    },
    filterScrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      paddingRight: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    chipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.card,
    },
    chipInactive: {
      borderColor: chipBorder,
      backgroundColor: theme.background,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    chipTextActive: {
      color: theme.primary,
    },
    chipTextInactive: {
      color: theme.subText,
    },
    searchIconBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    centerMessage: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: 14,
      color: theme.subText,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorText: {
      fontSize: 14,
      color: theme.subText,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    retryBtnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    separator: {
      height: 1,
      backgroundColor: divider,
      marginVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    productVisual: {
      position: 'relative',
      width: PRODUCT_CIRCLE,
      height: PRODUCT_CIRCLE,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    productCircle: {
      width: PRODUCT_CIRCLE,
      height: PRODUCT_CIRCLE,
      borderRadius: PRODUCT_CIRCLE / 2,
      backgroundColor: placeholder,
    },
    overlapAvatarWrap: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: OVERLAP_AVATAR + 6,
      height: OVERLAP_AVATAR + 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlapAvatar: {
      width: OVERLAP_AVATAR,
      height: OVERLAP_AVATAR,
      borderRadius: OVERLAP_AVATAR / 2,
      borderWidth: 2.5,
      borderColor: theme.background,
      backgroundColor: placeholder,
    },
    overlapStatusDot: {
      position: 'absolute',
      right: 1,
      bottom: 1,
      width: 11,
      height: 11,
      borderRadius: 5.5,
      borderWidth: 2,
      borderColor: theme.background,
    },
    dotGreen: {
      backgroundColor: CHAT_ACCENT.onlineGreen,
    },
    dotRed: {
      backgroundColor: CHAT_ACCENT.notificationRed,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 3,
    },
    productTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 1,
    },
    contactName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.subText,
      marginRight: 2,
      flexShrink: 1,
    },
    previewGrey: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.subText + 'AA',
      marginTop: 1,
    },
    unreadLine: {
      fontSize: 14,
      color: theme.subText + 'AA',
      marginTop: 1,
    },
    unreadBold: {
      fontWeight: '700',
      color: theme.text,
    },
    directAvatarWrap: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      marginRight: 12,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    directAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: placeholder,
    },
    directOnlineDot: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.background,
    },
    directName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    activeStatus: {
      fontSize: 14,
      color: theme.subText,
      marginTop: 4,
    },
  });
};

export type ChatScreenStyles = ReturnType<typeof getChatScreenStyles>;
