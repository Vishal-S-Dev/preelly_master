import { useCallback, useEffect, useMemo } from 'react';
import { useEditProductStore } from '../../../../../store/editProductStore';
import {
  flattenFormFields,
  resolveStoredFieldValue,
  findFormStep,
  sortStepFields,
  syncDynamicFieldsFromFilterOptions,
  getDependentFieldNames,
} from '../../../../../utils/dynamicFormUtils';
import { resolveDynamicFormCategoryId } from '../../../../../utils/resolveDynamicFormCategoryId';
import { useDynamicForm } from '../../../../hooks/useDynamicForm';
import {
  isEditDynamicFormComplete,
  mergeDraftWithFormFields,
  resolveEditFormFieldValue,
} from '../utils/editFormFieldValues';

const fieldsEqual = (left: Record<string, string>, right: Record<string, string>): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every(key => left[key] === right[key]);
};

export const useEditDynamicFormStep = (stepKey: '3' | '4') => {
  const productId = useEditProductStore(state => state.productId);
  const title = useEditProductStore(state => state.title);
  const phone = useEditProductStore(state => state.phone);
  const price = useEditProductStore(state => state.price);
  const locateYourItem = useEditProductStore(state => state.locateYourItem);
  const locationAddress = useEditProductStore(state => state.locationAddress);
  const dynamicFields = useEditProductStore(state => state.dynamicFields);
  const store = useEditProductStore();

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
    if (!query.data?.categoryId || !allFormFields.length) {
      return;
    }

    const draft = useEditProductStore.getState().getDraft();
    const current = useEditProductStore.getState().dynamicFields;
    let merged = mergeDraftWithFormFields(draft, allFormFields, current);
    merged = syncDynamicFieldsFromFilterOptions(allFormFields, merged);

    if (!fieldsEqual(merged, current)) {
      store.setDynamicFields(merged);
    }
  }, [
    allFormFields,
    query.data?.categoryId,
    productId,
    title,
    phone,
    price,
    locateYourItem,
    locationAddress,
    store,
  ]);

  const getFieldValue = useCallback(
    (fieldName: string) => {
      const field = fieldByName[fieldName];
      if (!field) {
        return dynamicFields[fieldName];
      }
      return dynamicFields[fieldName] ?? resolveEditFormFieldValue(field, store.getDraft());
    },
    [dynamicFields, fieldByName, store],
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const field = fieldByName[fieldName];
      const stored = field ? resolveStoredFieldValue(field, value) ?? value : value;
      const dependents = field ? getDependentFieldNames(field, stepFields) : [];
      if (dependents.length) {
        const next = { ...dynamicFields, [fieldName]: stored };
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
      if (normalizedName.includes('title') || fieldTitle.includes('title')) {
        store.setTitle(stored);
      }
      if (fieldName === 'isInsured') {
        store.setInsuredInUae(stored);
      }
    },
    [dynamicFields, fieldByName, stepFields, store],
  );

  const requiredFilled = useMemo(
    () => isEditDynamicFormComplete(stepFields, store.getDraft(), dynamicFields),
    [dynamicFields, stepFields, store, title, phone, price],
  );

  return {
    ...query,
    stepFields,
    formCategoryId,
    handleFieldChange,
    getFieldValue,
    requiredFilled,
    dynamicFields,
  };
};
