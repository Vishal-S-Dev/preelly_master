import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NATIONALITIES } from '../../../../../constants/nationalities';
import { ProfileEditInput } from './ProfileEditInput';
import { PE_COLORS } from '../profileEditStyles';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const NationalitySelector = memo<Props>(({ value, onChange, error }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return NATIONALITIES;
    }
    return NATIONALITIES.filter(item => item.toLowerCase().includes(q));
  }, [query]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    [],
  );

  return (
    <>
      <Pressable onPress={() => sheetRef.current?.present()} accessibilityRole="button">
        <View pointerEvents="none">
          <ProfileEditInput
            value={value}
            placeholder="Search Nationality"
            onChangeText={onChange}
            leftIcon="magnify"
            error={error}
            editable={false}
          />
        </View>
      </Pressable>
      <BottomSheetModal ref={sheetRef} snapPoints={['70%']} backdropComponent={renderBackdrop}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: PE_COLORS.text }}>Nationality</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            style={{
              marginTop: 10,
              borderWidth: 1,
              borderColor: PE_COLORS.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: PE_COLORS.text,
            }}
            accessibilityLabel="Search nationality"
          />
        </View>
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
              onPress={() => {
                onChange(item);
                sheetRef.current?.dismiss();
                setQuery('');
              }}>
              <Text style={{ color: PE_COLORS.text, fontSize: 15, fontWeight: value === item ? '700' : '500' }}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </BottomSheetModal>
    </>
  );
});

NationalitySelector.displayName = 'NationalitySelector';
