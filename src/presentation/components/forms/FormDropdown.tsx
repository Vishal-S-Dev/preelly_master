import React, { memo, useState } from 'react';
import { Pressable, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FormField } from '../../../types/dynamicForm.types';
import {
  getSortedFilterOptions,
  resolveDropdownDisplayLabel,
} from '../../../utils/dynamicFormUtils';
import { FormFieldWrapper } from './FormFieldWrapper';
import { FormSelectFullScreenModal } from './FormSelectFullScreenModal';
import { formStyles } from './formStyles';

interface Props {
  field: FormField;
  value?: string;
  onChange: (fieldName: string, value: string) => void;
  stepFields?: FormField[];
  formValues?: Record<string, string>;
}

export const FormDropdown = memo<Props>(({ field, value, onChange, stepFields = [], formValues = {} }) => {
  const [visible, setVisible] = useState(false);
  const options = getSortedFilterOptions(field, stepFields, formValues);
  const displayValue = resolveDropdownDisplayLabel(field, value, stepFields, formValues);
  const canOpen = options.length > 0;

  return (
    <FormFieldWrapper label={field.fieldTitle}>
      <Pressable
        onPress={() => canOpen && setVisible(true)}
        style={[formStyles.control, !canOpen && formStyles.controlDisabled]}
        disabled={!canOpen}
      >
        <Text style={[formStyles.controlText, !displayValue && formStyles.placeholderText]} numberOfLines={1}>
          {displayValue ?? field.placeholder ?? 'Select'}
        </Text>
        <Icon name="chevron-down" size={22} color="#4B5563" />
      </Pressable>
      <FormSelectFullScreenModal
        visible={visible}
        field={field}
        stepFields={stepFields}
        formValues={formValues}
        onSelect={onChange}
        onClose={() => setVisible(false)}
      />
    </FormFieldWrapper>
  );
});

FormDropdown.displayName = 'FormDropdown';
