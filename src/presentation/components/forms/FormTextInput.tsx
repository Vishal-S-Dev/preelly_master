import React, { memo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FormField } from '../../../types/dynamicForm.types';
import { getTextInputConfig } from '../../../utils/dynamicFormUtils';
import { FormFieldWrapper } from './FormFieldWrapper';
import { FORM_COLORS, formStyles } from './formStyles';

interface Props {
  field: FormField;
  value?: string;
  onChange: (fieldName: string, value: string) => void;
}

export const FormTextInput = memo<Props>(({ field, value, onChange }) => {
  const [focused, setFocused] = useState(false);
  const { keyboardType, suffix, showCalendarIcon } = getTextInputConfig(field);

  return (
    <FormFieldWrapper label={field.fieldTitle} helperText="Description">
      <View style={[formStyles.control, focused && formStyles.controlFocused]}>
        <TextInput
          style={formStyles.controlText}
          value={value ?? ''}
          placeholder={field.placeholder}
          placeholderTextColor={FORM_COLORS.placeholder}
          keyboardType={keyboardType}
          onChangeText={text => onChange(field.fieldName, text)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix ? <Text style={formStyles.suffix}>{suffix}</Text> : null}
        {showCalendarIcon ? <Icon name="calendar-month-outline" size={20} color="#4B5563" /> : null}
        {value && !suffix && !showCalendarIcon ? (
          <Pressable onPress={() => onChange(field.fieldName, '')} hitSlop={8}>
            <Icon name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </View>
    </FormFieldWrapper>
  );
});

FormTextInput.displayName = 'FormTextInput';
