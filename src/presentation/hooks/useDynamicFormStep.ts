import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCreatePostStore } from '../../store/createPostStore';
import {
  flattenFormFields,
  isDynamicFormComplete,
  resolveStoredFieldValue,
  findFormStep,
  sortStepFields,
  syncDynamicFieldsFromFilterOptions,
  getDependentFieldNames,
} from '../../utils/dynamicFormUtils';
import { resolveDynamicFormCategoryId } from '../../utils/resolveDynamicFormCategoryId';
import { useDynamicForm } from './useDynamicForm';

export const useDynamicFormStep = (stepKey: '3' | '4') => {
  const store = useCreatePostStore();
  const formCategoryId =
    store.dynamicFormCategoryId ??
    resolveDynamicFormCategoryId(store.subcategoryId, store.categoryId);
  const query = useDynamicForm(formCategoryId);

  const stepFields = useMemo(() => {
    const step = findFormStep(query.data?.steps, stepKey);
    return step ? sortStepFields(step.fields) : [];
  }, [query.data?.steps, stepKey]);

  const allFormFields = useMemo(() => {
    const steps = query.data?.steps?.filter(
      item => String(item.step) === '3' || String(item.step) === '4',
    );
    return steps?.length ? flattenFormFields(steps) : [];
  }, [query.data?.steps]);

  const fieldByName = useMemo(
    () => Object.fromEntries(stepFields.map(field => [field.fieldName, field])),
    [stepFields],
  );

  useEffect(() => {
    if (!query.data?.categoryId || !allFormFields.length) return;
    const synced = syncDynamicFieldsFromFilterOptions(allFormFields, store.dynamicFields);
    if (synced !== store.dynamicFields) {
      store.setDynamicFields(synced);
    }
  }, [allFormFields, query.data?.categoryId, store]);

  const extractionApplied = useRef(false);
  useEffect(() => {
    if (extractionApplied.current || stepKey !== '3') return;
    extractionApplied.current = true;
    store.applyExtractionToFields();
  }, [stepKey, store]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const field = fieldByName[fieldName];
      const stored = field ? resolveStoredFieldValue(field, value) ?? value : value;
      const dependents = field ? getDependentFieldNames(field, stepFields) : [];
      if (dependents.length) {
        const next = { ...store.dynamicFields, [fieldName]: stored };
        dependents.forEach(name => {
          next[name] = '';
        });
        store.setDynamicFields(next);
      } else {
        store.setDynamicField(fieldName, stored);
      }
      const fieldTitle = field?.fieldTitle?.toLowerCase() ?? '';
      const normalizedName = fieldName.toLowerCase();
      if (normalizedName.includes('phone') || fieldTitle.includes('phone')) {
        store.setPhone(stored);
      }
      if (normalizedName.includes('price') || fieldTitle.includes('price')) {
        store.setPrice(stored);
      }
      if (fieldName === 'isInsured') store.setInsuredInUae(stored);
    },
    [fieldByName, stepFields, store],
  );

  const requiredFilled = useMemo(
    () => isDynamicFormComplete(stepFields, store.dynamicFields),
    [stepFields, store.dynamicFields],
  );

  return { ...query, stepFields, formCategoryId, handleFieldChange, requiredFilled, dynamicFields: store.dynamicFields };
};
