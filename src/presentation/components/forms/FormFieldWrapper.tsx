import React, { memo, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { formStyles } from './formStyles';

interface Props {
  label: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
}

export const FormFieldWrapper = memo<Props>(({ label, required = true, helperText = 'Description', children }) => (
  <View style={formStyles.fieldWrap}>
    <Text style={formStyles.label}>
      {label}
      {required ? '*' : ''}
    </Text>
    {children}
    {helperText ? <Text style={formStyles.helper}>{helperText}</Text> : null}
  </View>
));

FormFieldWrapper.displayName = 'FormFieldWrapper';
