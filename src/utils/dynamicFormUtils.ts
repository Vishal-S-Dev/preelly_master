import {
  DynamicFormData,
  DynamicFormFieldTypeValue,
  DynamicFormResponse,
  FormField,
  FormFieldOption,
  FormStep,
} from '../types/dynamicForm.types';

const FIELD_TYPES: DynamicFormFieldTypeValue[] = ['Dropdown', 'Text', 'Radio', 'Checkbox'];

const normalizeFieldType = (raw: unknown): DynamicFormFieldTypeValue => {
  if (typeof raw === 'string' && FIELD_TYPES.includes(raw as DynamicFormFieldTypeValue)) {
    return raw as DynamicFormFieldTypeValue;
  }
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const value = (raw as { value?: string }).value;
    if (value && FIELD_TYPES.includes(value as DynamicFormFieldTypeValue)) {
      return value as DynamicFormFieldTypeValue;
    }
  }
  return 'Text';
};

const normalizeOption = (raw: Record<string, unknown>): FormFieldOption | null => {
  const value = String(raw.value ?? raw._id ?? '').trim();
  const label = String(raw.label ?? raw.name ?? '').trim();
  if (!value && !label) {
    return null;
  }
  const children = Array.isArray(raw.children)
    ? raw.children
        .map(item => normalizeOption(item as Record<string, unknown>))
        .filter((item): item is FormFieldOption => Boolean(item))
    : undefined;

  return {
    value: value || label,
    label: label || value,
    slug: typeof raw.slug === 'string' ? raw.slug : undefined,
    children: children?.length ? children : undefined,
  };
};

const normalizeField = (raw: Record<string, unknown>): FormField => {
  const legacyOptions = Array.isArray(raw.filterOptions) ? raw.filterOptions : [];
  const nextOptions = Array.isArray(raw.options) ? raw.options : legacyOptions;

  return {
    id: String(raw.id ?? raw._id ?? raw.fieldName ?? ''),
    fieldName: String(raw.fieldName ?? ''),
    fieldTitle: String(raw.fieldTitle ?? ''),
    placeholder: String(raw.placeholder ?? ''),
    fieldType: normalizeFieldType(raw.fieldType),
    formStep: Number(raw.formStep ?? 0),
    fieldOrder: Number(raw.fieldOrder ?? 0),
    validation: typeof raw.validation === 'string' ? raw.validation : undefined,
    tableName: typeof raw.tableName === 'string' ? raw.tableName : undefined,
    functionName: typeof raw.functionName === 'string' ? raw.functionName : undefined,
    options: nextOptions
      .map(item => normalizeOption(item as Record<string, unknown>))
      .filter((item): item is FormFieldOption => Boolean(item)),
  };
};

const normalizeStep = (raw: Record<string, unknown>): FormStep => ({
  step: Number(raw.step ?? 0),
  fields: (Array.isArray(raw.fields) ? raw.fields : [])
    .map(item => normalizeField(item as Record<string, unknown>))
    .filter(field => Boolean(field.fieldName)),
});

export const normalizeDynamicFormData = (response: DynamicFormResponse | DynamicFormData): DynamicFormData => {
  const payload =
    'data' in response && response.data
      ? response.data
      : (response as DynamicFormData);

  const steps = (payload.steps ?? []).map(step => normalizeStep(step as unknown as Record<string, unknown>));

  return {
    categoryId: String(payload.categoryId ?? ''),
    categoryName: payload.categoryName,
    totalSteps: Number(payload.totalSteps ?? steps.length),
    steps,
  };
};

export const getFieldOptions = (field: FormField): FormFieldOption[] => field.options ?? [];

export const getOptionValue = (option: FormFieldOption): string => option.value;

export const hasNestedOptions = (options: FormFieldOption[]): boolean =>
  options.some(option => Boolean(option.children?.length));

export const getMaxOptionTreeDepth = (options: FormFieldOption[]): number => {
  if (!options.length) {
    return 0;
  }
  let max = 1;
  options.forEach(option => {
    if (option.children?.length) {
      max = Math.max(max, 1 + getMaxOptionTreeDepth(option.children));
    }
  });
  return max;
};

export const findOptionInTree = (
  options: FormFieldOption[],
  value: string,
  path: string[] = [],
): { option: FormFieldOption; path: string[] } | undefined => {
  for (const option of options) {
    const nextPath = [...path, option.label];
    if (option.value === value || option.label === value || option.slug === value) {
      return { option, path: nextPath };
    }
    if (option.children?.length) {
      const nested = findOptionInTree(option.children, value, nextPath);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
};

export const findFieldOption = (
  options: FormFieldOption[],
  value: string,
): FormFieldOption | undefined => {
  const flat = options.find(
    option =>
      option.value === value ||
      option.label === value ||
      option.slug === value,
  );
  if (flat) {
    return flat;
  }
  return findOptionInTree(options, value)?.option;
};

const flattenOptionsToDepth = (
  options: FormFieldOption[],
  targetDepth: number,
  path: string[] = [],
): FormFieldOption[] => {
  const result: FormFieldOption[] = [];

  options.forEach(option => {
    const nextPath = [...path, option.label];
    if (option.children?.length && nextPath.length < targetDepth) {
      result.push(...flattenOptionsToDepth(option.children, targetDepth, nextPath));
      return;
    }
    if (nextPath.length === targetDepth) {
      result.push({
        value: option.value,
        label: nextPath.join('.'),
        slug: option.slug,
      });
    }
  });

  return result;
};

export const findCascadeParentField = (
  field: FormField,
  stepFields: FormField[],
): FormField | undefined => {
  if (field.options.length > 0 || field.fieldType !== 'Dropdown') {
    return undefined;
  }

  const fieldIndex = stepFields.findIndex(item => item.fieldName === field.fieldName);
  if (fieldIndex <= 0) {
    return undefined;
  }

  for (let index = fieldIndex - 1; index >= 0; index -= 1) {
    const candidate = stepFields[index];
    if (candidate.fieldType !== 'Dropdown') {
      continue;
    }
    if (hasNestedOptions(candidate.options)) {
      return candidate;
    }
  }

  return undefined;
};

export const getFlattenedDisplayDepth = (field: FormField, stepFields: FormField[]): number => {
  const treeDepth = getMaxOptionTreeDepth(field.options);
  if (!hasNestedOptions(field.options)) {
    return 1;
  }

  const fieldIndex = stepFields.findIndex(item => item.fieldName === field.fieldName);
  const hasDependentDropdown = stepFields
    .slice(fieldIndex + 1)
    .some(item => item.fieldType === 'Dropdown' && item.options.length === 0);

  return hasDependentDropdown ? Math.max(treeDepth - 1, 1) : treeDepth;
};

export const getDependentFieldNames = (field: FormField, stepFields: FormField[]): string[] => {
  const fieldIndex = stepFields.findIndex(item => item.fieldName === field.fieldName);
  if (fieldIndex < 0) {
    return [];
  }

  const dependents: string[] = [];
  for (let index = fieldIndex + 1; index < stepFields.length; index += 1) {
    const candidate = stepFields[index];
    if (candidate.fieldType !== 'Dropdown') {
      continue;
    }
    if (candidate.options.length > 0) {
      break;
    }
    dependents.push(candidate.fieldName);
  }

  return dependents;
};

export const getDropdownOptionsForField = (
  field: FormField,
  stepFields: FormField[],
  values: Record<string, string>,
): FormFieldOption[] => {
  const parentField = findCascadeParentField(field, stepFields);
  if (parentField) {
    const parentValue = values[parentField.fieldName];
    if (!parentValue) {
      return [];
    }
    const match = findOptionInTree(parentField.options, parentValue);
    return match?.option.children ?? [];
  }

  if (hasNestedOptions(field.options)) {
    const displayDepth = getFlattenedDisplayDepth(field, stepFields);
    return flattenOptionsToDepth(field.options, displayDepth);
  }

  return getFieldOptions(field);
};

export const getSortedFilterOptions = (
  field: FormField,
  stepFields: FormField[] = [],
  values: Record<string, string> = {},
): FormFieldOption[] => {
  const options =
    stepFields.length > 0
      ? getDropdownOptionsForField(field, stepFields, values)
      : getFieldOptions(field);
  return [...options];
};

export const resolveDropdownDisplayLabel = (
  field: FormField,
  value: string | undefined,
  stepFields: FormField[] = [],
  values: Record<string, string> = {},
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const parentField = findCascadeParentField(field, stepFields);
  if (parentField) {
    const options = getDropdownOptionsForField(field, stepFields, values);
    return resolveOptionLabel(options, value);
  }

  if (hasNestedOptions(field.options)) {
    const displayDepth = getFlattenedDisplayDepth(field, stepFields);
    const match = findOptionInTree(field.options, value);
    if (match) {
      return match.path.slice(0, displayDepth).join('.');
    }
  }

  const options = getDropdownOptionsForField(field, stepFields, values);
  return resolveOptionLabel(options, value) ?? value;
};

export const resolveStoredFieldValue = (
  field: FormField,
  rawValue?: string,
): string | undefined => {
  if (!rawValue?.trim()) {
    return undefined;
  }

  const options = getFieldOptions(field);
  if (!options.length) {
    return rawValue;
  }

  if (field.fieldType === 'Checkbox') {
    const resolved = parseMultiValue(rawValue)
      .map(part => findFieldOption(options, part))
      .filter((option): option is FormFieldOption => Boolean(option))
      .map(getOptionValue);
    return resolved.length ? serializeMultiValue(resolved) : rawValue;
  }

  if (field.fieldType === 'Dropdown' || field.fieldType === 'Radio') {
    const match = findFieldOption(options, rawValue);
    return match ? getOptionValue(match) : rawValue;
  }

  return rawValue;
};

const getValueForField = (
  field: FormField,
  values: Record<string, string>,
): string | undefined => {
  if (values[field.fieldName]?.trim()) {
    return values[field.fieldName];
  }
  const matchKey = Object.keys(values).find(
    key => key.toLowerCase() === field.fieldName.toLowerCase(),
  );
  return matchKey ? values[matchKey] : undefined;
};

export const syncDynamicFieldsFromFilterOptions = (
  fields: FormField[],
  values: Record<string, string>,
): Record<string, string> => {
  const next = { ...values };
  let changed = false;

  fields.forEach(field => {
    const current = getValueForField(field, next);
    if (!current) {
      return;
    }
    const resolved = resolveStoredFieldValue(field, current) ?? current;
    const canonicalKey = field.fieldName;
    const existingCanonical = next[canonicalKey];
    const needsKeyNormalization = Object.keys(next).some(
      key => key.toLowerCase() === canonicalKey.toLowerCase() && key !== canonicalKey,
    );

    if (resolved !== existingCanonical || needsKeyNormalization) {
      Object.keys(next).forEach(key => {
        if (key.toLowerCase() === canonicalKey.toLowerCase()) {
          delete next[key];
        }
      });
      next[canonicalKey] = resolved;
      changed = true;
    }
  });

  return changed ? next : values;
};

/** Resolve labels/slugs to option values (ObjectIds) before API submit. */
export const resolveDynamicFieldsForApi = (
  fields: FormField[],
  values: Record<string, string>,
): Record<string, string> => syncDynamicFieldsFromFilterOptions(fields, values);

export const resolveOptionLabel = (
  options: FormFieldOption[],
  value?: string,
): string | undefined => {
  if (!value) {
    return undefined;
  }
  const match = findFieldOption(options, value);
  return match?.label ?? value;
};

export const parseMultiValue = (value?: string): string[] =>
  value
    ? value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    : [];

export const serializeMultiValue = (values: string[]): string => values.join(',');

export const sortStepFields = (fields: FormField[]): FormField[] =>
  [...fields].sort((left, right) => left.fieldOrder - right.fieldOrder);

export const getTextInputConfig = (field: FormField) => {
  const name = field.fieldName.toLowerCase();
  const title = field.fieldTitle.toLowerCase();

  if (name.includes('phone')) {
    return { keyboardType: 'phone-pad' as const };
  }
  if (name.includes('price') || title.includes('price')) {
    return { keyboardType: 'numeric' as const, suffix: 'AED' };
  }
  if (name.includes('year') || title.includes('year')) {
    return { keyboardType: 'numeric' as const, showCalendarIcon: true };
  }
  return { keyboardType: 'default' as const };
};

export const flattenFormFields = (steps: FormStep[]): FormField[] =>
  [...steps]
    .sort((a, b) => a.step - b.step)
    .flatMap(step => sortStepFields(step.fields));

export const getFilterOptionLabels = (field: FormField): string[] =>
  getFieldOptions(field).map(option => option.label).filter(Boolean);

export const isFieldRequired = (field: FormField): boolean => {
  const validation = (field.validation ?? '').trim().toLowerCase();
  if (!validation) {
    return false;
  }
  return validation.includes('required') || validation === 'rwquired';
};

export const isDynamicFormComplete = (
  fields: FormField[],
  values: Record<string, string>,
): boolean =>
  fields.filter(isFieldRequired).every(field => Boolean(values[field.fieldName]?.trim()));

export const findFormStep = (steps: FormStep[] | undefined, stepKey: string | number): FormStep | undefined =>
  steps?.find(item => String(item.step) === String(stepKey));
