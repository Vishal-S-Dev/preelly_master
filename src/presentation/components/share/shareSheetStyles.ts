import { StyleSheet } from 'react-native';

export const SHARE_UI = {
  sheetBg: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  primary: '#0095F6',
  primaryLight: '#E8F4FD',
  checkBlue: '#0095F6',
  chipBg: '#F3F4F6',
};

export const shareSheetStyles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: SHARE_UI.sheetBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SHARE_UI.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  gridRow: {
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SHARE_UI.text,
    marginTop: 12,
  },
  emptyBody: {
    fontSize: 14,
    color: SHARE_UI.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyLoadingText: {
    fontSize: 14,
    color: SHARE_UI.textMuted,
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: SHARE_UI.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
