import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/colors';
import { fontText } from '../../../utils/fonts';

export const getInfoPageStyles = (theme: AppTheme) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
    },
    description: {
      ...fontText.regular12,
      fontSize: 14,
      color: theme.subText,
      marginBottom: 20,
      lineHeight: 20,
    },
    card: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      backgroundColor: theme.background,
      padding: 20,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.primary}14`,
      marginBottom: 16,
    },
    bodyText: {
      ...fontText.regular12,
      fontSize: 14,
      color: theme.subText,
      lineHeight: 21,
      marginBottom: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: `${theme.primary}33`,
      backgroundColor: `${theme.primary}0F`,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    actionBtnText: {
      ...fontText.semibold13,
      fontSize: 14,
      color: theme.primary,
    },
    faqItem: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E7EB',
      paddingVertical: 16,
    },
    faqItemFirst: {
      borderTopWidth: 0,
      paddingTop: 0,
    },
    faqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    faqQuestion: {
      ...fontText.semibold13,
      flex: 1,
      fontSize: 15,
      color: theme.text,
    },
    faqAnswer: {
      ...fontText.regular12,
      fontSize: 14,
      color: theme.subText,
      lineHeight: 20,
      marginTop: 10,
      paddingRight: 4,
    },
  });

export type InfoPageStyles = ReturnType<typeof getInfoPageStyles>;
