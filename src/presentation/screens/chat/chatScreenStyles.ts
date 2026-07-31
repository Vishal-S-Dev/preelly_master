import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/colors';

/** Semantic accents that stay consistent across light/dark. */
export const CHAT_ACCENT = {
  onlineGreen: '#22C55E',
  notificationRed: '#EF4444',
  verifiedBlue: '#2563EB',
  chipActiveBg: '#F0F2FF',
  chipActiveText: '#1E3A8A',
  composeNavy: '#0F172A',
  previewMuted: '#9CA3AF',
  chipBorder: '#E5E7EB',
} as const;

const AVATAR_SIZE = 60;
const PRODUCT_CIRCLE = AVATAR_SIZE;
const OVERLAP_AVATAR = 28;

export const getChatScreenStyles = (theme: AppTheme) => {
  const placeholder = theme.card;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 14,
      paddingTop: 4,
    },
    headerBackBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 2,
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
      minWidth: 0,
      paddingRight: 8,
    },
    headerAvatarWrap: {
      position: 'relative',
      marginRight: 12,
    },
    headerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: placeholder,
    },
    headerAvatarNotifyDot: {
      position: 'absolute',
      top: 1,
      right: 1,
      width: 11,
      height: 11,
      borderRadius: 5.5,
      backgroundColor: CHAT_ACCENT.notificationRed,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    headerTitles: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    headerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: -0.3,
      maxWidth: 200,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: '#6B7280',
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
      paddingBottom: 14,
    },
    toolbarWrap: {
      overflow: 'hidden',
    },
    searchSlot: {
      paddingHorizontal: 16,
      overflow: 'hidden',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CHAT_ACCENT.chipBorder,
      backgroundColor: '#F9FAFB',
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 10,
      fontSize: 15,
      color: '#111827',
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
      gap: 0,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 22,
      borderWidth: 1,
      marginRight: 8,
    },
    chipActive: {
      borderColor: 'transparent',
      backgroundColor: CHAT_ACCENT.chipActiveBg,
    },
    chipInactive: {
      borderColor: CHAT_ACCENT.chipBorder,
      backgroundColor: '#FFFFFF',
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    chipTextActive: {
      color: CHAT_ACCENT.chipActiveText,
    },
    chipTextInactive: {
      color: '#111827',
    },
    searchIconBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 28,
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
      color: '#0F172A',
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
    },
    errorText: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.primary,
    },
    retryBtnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
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
      marginRight: 14,
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
      right: -3,
      bottom: -3,
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
      borderColor: '#FFFFFF',
      backgroundColor: placeholder,
    },
    overlapStatusDot: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 11,
      height: 11,
      borderRadius: 5.5,
      borderWidth: 2,
      borderColor: '#FFFFFF',
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
      gap: 2,
    },
    productTitle: {
      fontSize: 16,
      fontWeight: '400',
      color: '#0F172A',
      letterSpacing: -0.25,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 1,
      gap: 4,
    },
    contactName: {
      fontSize: 13,
      fontWeight: '400',
      color: '#6B7280',
      flexShrink: 1,
    },
    previewGrey: {
      fontSize: 13,
      fontWeight: '400',
      color: CHAT_ACCENT.previewMuted,
      marginTop: 1,
    },
    unreadLine: {
      fontSize: 13,
      color: CHAT_ACCENT.previewMuted,
      marginTop: 1,
    },
    unreadBold: {
      fontWeight: '700',
      color: '#0F172A',
    },
    directAvatarWrap: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      marginRight: 14,
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
      right: 1,
      bottom: 1,
      width: 13,
      height: 13,
      borderRadius: 6.5,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
    },
    directName: {
      fontSize: 16,
      fontWeight: '400',
      color: '#0F172A',
      letterSpacing: -0.25,
    },
    activeStatus: {
      fontSize: 14,
      fontWeight: '400',
      color: '#6B7280',
      marginTop: 2,
    },
  });
};

export type ChatScreenStyles = ReturnType<typeof getChatScreenStyles>;
