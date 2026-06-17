import React, { memo, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FormField } from '../../../types/dynamicForm.types';
import {
  getOptionValue,
  getSortedFilterOptions,
  parseMultiValue,
  serializeMultiValue,
} from '../../../utils/dynamicFormUtils';
import { FormFieldWrapper } from './FormFieldWrapper';
import { formStyles } from './formStyles';

interface Props {
  field: FormField;
  value?: string;
  onChange: (fieldName: string, value: string) => void;
  maxVisible?: number;
}

export const FormCheckboxGroup = memo<Props>(({ field, value, onChange, maxVisible = 5 }) => {
  const options = getSortedFilterOptions(field);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, maxVisible);
  const selected = parseMultiValue(value);
  const hasMore = options.length > maxVisible;

  const toggle = useCallback(
    (optionValue: string) => {
      const next = selected.includes(optionValue)
        ? selected.filter(item => item !== optionValue)
        : [...selected, optionValue];
      onChange(field.fieldName, serializeMultiValue(next));
    },
    [field.fieldName, onChange, selected],
  );

  return (
    <FormFieldWrapper label={field.fieldTitle} required={false}>
      <View style={formStyles.checkboxWrap}>
        {visible.map(option => {
          const optionValue = getOptionValue(option);
          const active = selected.includes(optionValue) || selected.includes(option.label);
          return (
            <Pressable
              key={option.value}
              style={[formStyles.checkboxChip, active && formStyles.checkboxChipSelected]}
              onPress={() => toggle(optionValue)}>
              <Text style={formStyles.checkboxChipLabel}>{option.label}</Text>
              <View
                style={[
                  formStyles.checkboxCheckCircle,
                  active && formStyles.checkboxCheckCircleSelected,
                ]}>
                <Icon name="check" size={12} color="#FFFFFF" />
              </View>
            </Pressable>
          );
        })}
        {hasMore ? (
          <Pressable style={formStyles.checkboxViewAllChip} onPress={() => setShowAll(prev => !prev)}>
            <Text style={formStyles.checkboxViewAllText}>{showAll ? 'View Less' : 'View All'}</Text>
          </Pressable>
        ) : null}
      </View>
    </FormFieldWrapper>
  );
});

FormCheckboxGroup.displayName = 'FormCheckboxGroup';
