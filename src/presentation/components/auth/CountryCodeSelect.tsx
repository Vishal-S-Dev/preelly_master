import React, { memo, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  COUNTRY_DIAL_CODES,
  CountryDialCode,
  DEFAULT_COUNTRY_DIAL_CODE,
} from '../../../constants/countryDialCodes';
import { AUTH_COLORS } from '../../screens/auth/loginScreenStyles';

interface Props {
  value?: CountryDialCode;
  onChange?: (country: CountryDialCode) => void;
  style?: StyleProp<ViewStyle>;
  flagStyle?: StyleProp<TextStyle>;
  codeStyle?: StyleProp<TextStyle>;
}

export const CountryCodeSelect = memo<Props>(
  ({ value = DEFAULT_COUNTRY_DIAL_CODE, onChange, style, flagStyle, codeStyle }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        return COUNTRY_DIAL_CODES;
      }
      return COUNTRY_DIAL_CODES.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.dialCode.includes(q) ||
          item.iso.toLowerCase().includes(q),
      );
    }, [query]);

    const onSelect = (country: CountryDialCode) => {
      onChange?.(country);
      setOpen(false);
      setQuery('');
    };

    return (
      <>
        <Pressable
          style={style}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country code ${value.dialCode}`}>
          <Text style={flagStyle}>{value.flag}</Text>
          <Text style={codeStyle}>{value.dialCode}</Text>
          <Icon name="chevron-down" size={18} color={AUTH_COLORS.icon} style={{ marginLeft: 4 }} />
        </Pressable>

        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={dropdownStyles.backdrop} onPress={() => setOpen(false)} />
          <View style={dropdownStyles.sheet}>
            <Text style={dropdownStyles.title}>Select country</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={AUTH_COLORS.placeholder}
              style={dropdownStyles.search}
            />
            <FlatList
              data={filtered}
              keyExtractor={item => item.iso}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const selected = item.iso === value.iso;
                return (
                  <Pressable
                    style={[dropdownStyles.row, selected ? dropdownStyles.rowSelected : null]}
                    onPress={() => onSelect(item)}>
                    <Text style={dropdownStyles.rowFlag}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={dropdownStyles.rowName}>{item.name}</Text>
                      <Text style={dropdownStyles.rowCode}>{item.dialCode}</Text>
                    </View>
                    {selected ? (
                      <Icon name="check" size={20} color={AUTH_COLORS.primaryButton} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Modal>
      </>
    );
  },
);

CountryCodeSelect.displayName = 'CountryCodeSelect';

const dropdownStyles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%' as const,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: AUTH_COLORS.heading,
    marginBottom: 10,
  },
  search: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: AUTH_COLORS.heading,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_COLORS.dividerLine,
  },
  rowSelected: {
    backgroundColor: '#F4F6FB',
    borderRadius: 10,
  },
  rowFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: AUTH_COLORS.heading,
  },
  rowCode: {
    fontSize: 13,
    color: AUTH_COLORS.subtitle,
    marginTop: 2,
  },
};
