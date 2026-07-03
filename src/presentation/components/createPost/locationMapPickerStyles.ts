import { Platform, StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/colors';

export const getLocationMapPickerStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    input: {
      borderRadius: 12,
      backgroundColor: theme.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      marginBottom: 10,
      fontSize: 15,
    },
    card: {
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E7EB',
      ...Platform.select({
        ios: {
          shadowColor: '#0F172A',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        },
        android: { elevation: 4 },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 8,
    },
    cardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 22,
    },
    infoIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    cardDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.subText,
      marginBottom: 16,
    },
    mapShell: {
      height: 220,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: '#E8EEF5',
    },
    map: {
      ...StyleSheet.absoluteFill,
    },
    mapOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(248,250,252,0.72)',
    },
    currentLocationBtn: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 5 },
      }),
    },
    statusText: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 16,
      color: theme.subText,
    },
  });
