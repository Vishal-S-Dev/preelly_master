import { StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/colors';

export const createSearchStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginRight: 40,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 24,
    },
    searchBarWrap: {
      paddingHorizontal: 16,
      marginBottom: 8,
      zIndex: 20,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 48,
      gap: 10,
      borderWidth: 1,
      borderColor: theme.subText + '22',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 0,
    },
    dropdown: {
      marginHorizontal: 16,
      marginTop: 6,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.subText + '22',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    dropdownItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.subText + '22',
    },
    dropdownText: {
      fontSize: 15,
      color: theme.text,
    },
    dropdownHighlight: {
      fontWeight: '700',
      color: theme.primary,
    },
    dropdownMeta: {
      padding: 16,
      alignItems: 'center',
    },
    dropdownMetaText: {
      fontSize: 14,
      color: theme.subText,
    },
    chipListContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
    },
    horizontalListContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
  });

export const SEARCH_CARD_WIDTH = 142;
export const SEARCH_CARD_HEIGHT = Math.round((SEARCH_CARD_WIDTH * 16) / 9);
