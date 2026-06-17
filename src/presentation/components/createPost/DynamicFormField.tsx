import React, { memo, useCallback } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { FormField } from '../../../types/dynamicForm.types';
import { getFilterOptionLabels } from '../../../utils/dynamicFormUtils';
import { BottomSheetSelect } from './BottomSheetSelect';
import { cpStyles } from './createPostStyles';

interface Props {
  field: FormField;
  value?: string;
  onChange: (fieldName: string, value: string) => void;
}

const parseCheckboxValue = (value?: string): string[] =>
  value
    ? value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    : [];

const joinCheckboxValue = (values: string[]): string => values.join(',');

export const DynamicFormField = memo<Props>(({ field, value, onChange }) => {
  const fieldType = field.fieldType;
  const options = getFilterOptionLabels(field);

  const handleCheckboxToggle = useCallback(
    (option: string) => {
      const selected = parseCheckboxValue(value);
      const next = selected.includes(option)
        ? selected.filter(item => item !== option)
        : [...selected, option];
      onChange(field.fieldName, joinCheckboxValue(next));
    },
    [field.fieldName, onChange, value],
  );

  if (fieldType === 'Dropdown') {
    return (
      <View style={{ marginBottom: 12 }}>
        <BottomSheetSelect
          label={field.fieldTitle}
          value={value}
          options={options}
          onSelect={selected => onChange(field.fieldName, selected)}
        />
      </View>
    );
  }

  if (fieldType === 'Text') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={cpStyles.inputLabel}>{field.fieldTitle}</Text>
        <TextInput
          style={cpStyles.input}
          value={value ?? ''}
          placeholder={field.placeholder || `Enter ${field.fieldTitle}`}
          placeholderTextColor="#9CA3AF"
          onChangeText={text => onChange(field.fieldName, text)}
        />
      </View>
    );
  }

  if (fieldType === 'Radio') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={cpStyles.inputLabel}>{field.fieldTitle}</Text>
        <View style={cpStyles.chipRow}>
          {options.map(option => (
            <Pressable
              key={option}
              style={[cpStyles.chip, value === option && cpStyles.chipActive]}
              onPress={() => onChange(field.fieldName, option)}>
              <Text style={value === option ? cpStyles.chipTextActive : cpStyles.chipText}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (fieldType === 'Checkbox') {
    const selected = parseCheckboxValue(value);
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={cpStyles.inputLabel}>{field.fieldTitle}</Text>
        <View style={cpStyles.chipRow}>
          {options.map(option => {
            const active = selected.includes(option);
            return (
              <Pressable
                key={option}
                style={[cpStyles.chip, active && cpStyles.chipActive]}
                onPress={() => handleCheckboxToggle(option)}>
                <Text style={active ? cpStyles.chipTextActive : cpStyles.chipText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return null;
});

DynamicFormField.displayName = 'DynamicFormField';
