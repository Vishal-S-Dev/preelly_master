import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormField } from '../../../types/dynamicForm.types';
import { getOptionValue, getSortedFilterOptions } from '../../../utils/dynamicFormUtils';
import { FormFieldWrapper } from './FormFieldWrapper';
import { formStyles } from './formStyles';

interface Props {
  field: FormField;
  value?: string;
  onChange: (fieldName: string, value: string) => void;
}

export const FormRadioGroup = memo<Props>(({ field, value, onChange }) => {
  const options = getSortedFilterOptions(field);

  return (
  <FormFieldWrapper label={field.fieldTitle} helperText="Description">
    <View style={formStyles.radioRow}>
      {options.map(option => {
        const optionValue = getOptionValue(option);
        const active = value === optionValue || value === option.label;
        return (
          <Pressable
            key={option.value}
            style={[formStyles.radioPill, active && formStyles.radioPillActive]}
            onPress={() => onChange(field.fieldName, optionValue)}>
            <Text style={[formStyles.radioText, active && formStyles.radioTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </FormFieldWrapper>
  );
});

FormRadioGroup.displayName = 'FormRadioGroup';
