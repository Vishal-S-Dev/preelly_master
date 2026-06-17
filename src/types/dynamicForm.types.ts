export interface FormFieldOption {
  value: string;
  label: string;
  slug?: string;
  children?: FormFieldOption[];
}

export type DynamicFormFieldTypeValue = 'Dropdown' | 'Text' | 'Radio' | 'Checkbox';

export interface FormField {
  id: string;
  fieldName: string;
  fieldTitle: string;
  placeholder: string;
  fieldType: DynamicFormFieldTypeValue;
  formStep: number;
  fieldOrder: number;
  validation?: string;
  tableName?: string;
  functionName?: string;
  options: FormFieldOption[];
}

export interface FormStep {
  step: number;
  fields: FormField[];
}

export interface DynamicFormData {
  categoryId: string;
  categoryName?: string;
  totalSteps: number;
  steps: FormStep[];
}

/** API may return wrapped `{ success, data }` or the form payload directly. */
export interface DynamicFormResponse {
  success?: boolean;
  message?: string;
  data?: DynamicFormData;
  categoryId?: string;
  categoryName?: string;
  totalSteps?: number;
  steps?: FormStep[];
}
