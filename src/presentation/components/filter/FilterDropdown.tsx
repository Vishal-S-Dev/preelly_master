import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface FilterDropdownOption {
  id: string;
  label: string;
}

interface Props {
  label: string;
  placeholder: string;
  value?: string;
  options: FilterDropdownOption[];
  disabled?: boolean;
  onSelect: (option: FilterDropdownOption) => void;
}

export const FilterDropdown = memo<Props>(
  ({ label, placeholder, value, options, disabled = false, onSelect }) => {
    const theme = useAppTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const selectedLabel = options.find(option => option.id === value)?.label;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
      ),
      [],
    );

    return (
      <View style={styles.wrap}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Pressable
          style={[
            styles.field,
            {
              borderColor: theme.subText + '33',
              backgroundColor: disabled ? theme.card : theme.background,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
          disabled={disabled}
          onPress={() => sheetRef.current?.present()}
          accessibilityRole="button"
          accessibilityLabel={`${label} dropdown`}
          accessibilityState={{ disabled }}
        >
          <Text style={{ color: selectedLabel ? theme.text : theme.subText, flex: 1 }} numberOfLines={1}>
            {selectedLabel ?? placeholder}
          </Text>
          <Icon name="chevron-down" size={20} color={theme.subText} />
        </Pressable>

        <BottomSheetModal ref={sheetRef} snapPoints={['50%']} backdropComponent={renderBackdrop}>
          <BottomSheetFlatList
            data={options}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.option, { borderBottomColor: theme.subText + '22' }]}
                onPress={() => {
                  onSelect(item);
                  sheetRef.current?.dismiss();
                }}
              >
                <Text style={{ color: theme.text, fontWeight: value === item.id ? '700' : '500' }}>
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </BottomSheetModal>
      </View>
    );
  },
);

FilterDropdown.displayName = 'FilterDropdown';

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export const mapCategoriesToDropdownOptions = (
  items: { _id: string; name: string }[],
): FilterDropdownOption[] =>
  items.map(item => ({ id: item._id, label: item.name }));
