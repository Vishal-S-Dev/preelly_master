import { FormField } from '../types/dynamicForm.types';
import { CreatePostDraft } from '../types/createPost.types';

/** Strip formatting (AED, commas) and keep a numeric price string for the API. */
export const normalizePriceValue = (raw?: string): string => {
  if (!raw?.trim()) {
    return '';
  }
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) {
    return '';
  }
  return String(num);
};

const getDynamicValue = (fields: Record<string, string>, fieldName: string): string => {
  const direct = fields[fieldName]?.trim();
  if (direct) {
    return direct;
  }
  const lower = fieldName.toLowerCase();
  const match = Object.entries(fields).find(([key]) => key.toLowerCase() === lower);
  return match?.[1]?.trim() ?? '';
};

const isPriceField = (field: FormField): boolean => {
  const name = field.fieldName.toLowerCase();
  const title = field.fieldTitle.toLowerCase();
  return name.includes('price') || title.includes('price');
};

const isPhoneField = (field: FormField): boolean => {
  const name = field.fieldName.toLowerCase();
  const title = field.fieldTitle.toLowerCase();
  return name.includes('phone') || title.includes('phone');
};

export const resolveListingPrice = (
  draft: CreatePostDraft,
  dynamicFields: Record<string, string> = {},
  formFields: FormField[] = [],
): string => {
  const fromDraft = normalizePriceValue(draft.price);
  if (fromDraft) {
    return fromDraft;
  }

  for (const field of formFields) {
    if (!isPriceField(field)) {
      continue;
    }
    const normalized = normalizePriceValue(getDynamicValue(dynamicFields, field.fieldName));
    if (normalized) {
      return normalized;
    }
  }

  for (const [key, value] of Object.entries(dynamicFields)) {
    if (key.toLowerCase().includes('price')) {
      const normalized = normalizePriceValue(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  return '';
};

export const resolveListingPhone = (
  draft: CreatePostDraft,
  dynamicFields: Record<string, string> = {},
  formFields: FormField[] = [],
): string => {
  const fromDraft = draft.phone?.trim();
  if (fromDraft) {
    return fromDraft;
  }

  for (const field of formFields) {
    if (!isPhoneField(field)) {
      continue;
    }
    const value = getDynamicValue(dynamicFields, field.fieldName);
    if (value) {
      return value;
    }
  }

  for (const [key, value] of Object.entries(dynamicFields)) {
    if (key.toLowerCase().includes('phone') && value?.trim()) {
      return value.trim();
    }
  }

  return '';
};

/** Dynamic-field API keys that are promoted to top-level listing price / phone fields. */
export const isPromotedListingFieldKey = (apiKey: string): boolean => {
  const key = apiKey.toLowerCase();
  return key.includes('price') || key.includes('phone');
};
