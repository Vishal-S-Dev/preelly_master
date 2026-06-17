import React, { memo, useCallback, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { cpStyles } from './createPostStyles';

interface Props {
  label: string;
  value?: string;
  options: string[];
  onSelect: (value: string) => void;
}

export const BottomSheetSelect = memo<Props>(({ label, value, options, onSelect }) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    [],
  );

  return (
    <>
      <Text style={cpStyles.inputLabel}>{label}*</Text>
      <Pressable
        style={[cpStyles.input, { justifyContent: 'center' }]}
        onPress={() => sheetRef.current?.present()}>
        <Text style={{ color: value ? '#111827' : '#9CA3AF' }}>{value || 'Select'}</Text>
      </Pressable>
      <BottomSheetModal ref={sheetRef} snapPoints={['50%']} backdropComponent={renderBackdrop}>
        <BottomSheetFlatList
          data={options}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Pressable
              style={cpStyles.listItem}
              onPress={() => {
                onSelect(item);
                sheetRef.current?.dismiss();
              }}>
              <Text style={cpStyles.listItemText}>{item}</Text>
            </Pressable>
          )}
        />
      </BottomSheetModal>
    </>
  );
});

BottomSheetSelect.displayName = 'BottomSheetSelect';
