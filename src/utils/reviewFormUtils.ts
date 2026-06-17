import { FormField } from '../types/dynamicForm.types';
import { parseMultiValue, resolveDropdownDisplayLabel, resolveOptionLabel } from './dynamicFormUtils';

export interface ReviewRow {
  label: string;
  value?: string;
}

export const buildFieldReviewRows = (
  fields: FormField[],
  values: Record<string, string>,
): ReviewRow[] =>
  fields.flatMap(field => {
    const raw = values[field.fieldName];
    if (!raw?.trim()) return [];
    if (field.fieldType === 'Checkbox') {
      const labels = parseMultiValue(raw)
        .map(part => resolveOptionLabel(field.options, part) ?? part)
        .filter(Boolean);
      return labels.length
        ? [{ label: field.fieldTitle.replace(/\*+$/, '').trim(), value: labels.join(', ') }]
        : [];
    }
    const displayValue =
      field.fieldType === 'Dropdown'
        ? resolveDropdownDisplayLabel(field, raw, fields, values) ?? raw
        : resolveOptionLabel(field.options, raw) ?? raw;
    return [
      {
        label: field.fieldTitle.replace(/\*+$/, '').trim(),
        value: displayValue,
      },
    ];
  });
