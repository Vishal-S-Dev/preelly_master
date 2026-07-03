import { FormField } from '../../../../../types/dynamicForm.types';
import { EditProductDraft } from '../../../../../types/editProduct.types';
import { isFieldRequired } from '../../../../../utils/dynamicFormUtils';
import {
  normalizeEditFieldKey,
  resolveEditFieldAliases,
  resolveEditFieldByTitle,
} from './propertyEditFieldMapping';

const normalizeKey = (value: string): string => normalizeEditFieldKey(value);

const getDynamicValue = (draft: EditProductDraft, fieldName: string): string | undefined => {
  const fromAliases = resolveEditFieldAliases(fieldName, draft.dynamicFields);
  if (fromAliases) {
    return fromAliases;
  }

  const direct = draft.dynamicFields[fieldName]?.trim();
  if (direct) {
    return direct;
  }

  const target = normalizeKey(fieldName);
  const match = Object.entries(draft.dynamicFields).find(
    ([key, value]) => normalizeKey(key) === target && value?.trim(),
  );
  return match?.[1]?.trim();
};

const matchesPattern = (field: FormField, pattern: string): boolean => {
  const name = field.fieldName.toLowerCase();
  const title = field.fieldTitle.toLowerCase();
  return name.includes(pattern) || title.includes(pattern);
};

const resolveLocationFromDraft = (draft: EditProductDraft): string | undefined => {
  const locate = draft.locateYourItem?.trim();
  const address = draft.locationAddress?.trim();
  if (locate && address) {
    return `${locate}, ${address}`;
  }
  return locate || address || undefined;
};

/** Resolve a single dynamic form field value from the edit draft (edit flow only). */
export const resolveEditFormFieldValue = (
  field: FormField,
  draft: EditProductDraft,
): string | undefined => {
  const fromDynamic = getDynamicValue(draft, field.fieldName);
  if (fromDynamic) {
    return fromDynamic;
  }

  if (matchesPattern(field, 'title') && !matchesPattern(field, 'subtitle')) {
    return draft.title?.trim() || undefined;
  }
  if (matchesPattern(field, 'phone')) {
    return draft.phone?.trim() || undefined;
  }
  if (matchesPattern(field, 'price')) {
    return draft.price?.trim() || undefined;
  }
  if (
    matchesPattern(field, 'location') ||
    matchesPattern(field, 'locate') ||
    field.fieldName.toLowerCase() === 'cityid'
  ) {
    return resolveLocationFromDraft(draft);
  }
  if (matchesPattern(field, 'description') || matchesPattern(field, 'describe')) {
    return draft.description?.trim() || undefined;
  }

  const byTitle = resolveEditFieldByTitle(field.fieldTitle, draft.dynamicFields);
  if (byTitle) {
    return byTitle;
  }

  return undefined;
};

/** Merge draft top-level + attribute values into canonical dynamic form field keys. */
export const mergeDraftWithFormFields = (
  draft: EditProductDraft,
  formFields: FormField[],
  values: Record<string, string>,
): Record<string, string> => {
  const next = { ...values };
  let changed = false;

  formFields.forEach(field => {
    if (next[field.fieldName]?.trim()) {
      return;
    }
    const resolved = resolveEditFormFieldValue(field, draft);
    if (resolved) {
      next[field.fieldName] = resolved;
      changed = true;
    }
  });

  return changed ? next : values;
};

export const isEditDynamicFormComplete = (
  fields: FormField[],
  draft: EditProductDraft,
  values: Record<string, string>,
): boolean =>
  fields
    .filter(isFieldRequired)
    .every(field => {
      const value = values[field.fieldName]?.trim() || resolveEditFormFieldValue(field, draft);
      return Boolean(value);
    });
