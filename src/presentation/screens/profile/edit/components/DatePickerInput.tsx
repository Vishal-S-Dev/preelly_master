import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { memo, useCallback, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { ProfileEditInput } from './ProfileEditInput';
import { formatDobDisplay, parseDobDisplayToDate } from '../profileEditUtils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const maxDate = new Date();
const minDate = new Date(1900, 0, 1);

export const DatePickerInput = memo<Props>(({ value, onChange, error }) => {
  const [iosVisible, setIosVisible] = useState(false);
  const [iosDate, setIosDate] = useState<Date>(parseDobDisplayToDate(value) ?? new Date(1995, 0, 1));

  const openPicker = useCallback(() => {
    const current = parseDobDisplayToDate(value) ?? new Date(1995, 0, 1);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: maxDate,
        minimumDate: minDate,
        onChange: (_event, selected) => {
          if (selected) {
            onChange(formatDobDisplay(selected));
          }
        },
      });
      return;
    }
    setIosDate(current);
    setIosVisible(true);
  }, [onChange, value]);

  return (
    <>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel="Date of birth">
        <View pointerEvents="none">
          <ProfileEditInput
            value={value}
            placeholder="DD/MM/YYYY"
            onChangeText={onChange}
            leftIcon="account-outline"
            rightIcon="calendar-month-outline"
            error={error}
            editable={false}
          />
        </View>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Modal visible={iosVisible} transparent animationType="slide" onRequestClose={() => setIosVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setIosVisible(false)} />
          <View style={{ backgroundColor: '#fff', paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12 }}>
              <Pressable
                onPress={() => {
                  onChange(formatDobDisplay(iosDate));
                  setIosVisible(false);
                }}>
                <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosDate}
              mode="date"
              display="spinner"
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={(_e, selected) => {
                if (selected) {
                  setIosDate(selected);
                }
              }}
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
});

DatePickerInput.displayName = 'DatePickerInput';
