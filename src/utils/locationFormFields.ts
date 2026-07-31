import { FormField } from '../types/dynamicForm.types';

const normalizeFieldTitle = (title: string): string =>
  title.replace(/\*+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const normalizeFieldName = (name: string): string =>
  name.replace(/[^a-z0-9]/gi, '').toLowerCase();

/** Dynamic form field: "Locate your item" */
export const isLocateYourItemField = (field: FormField): boolean => {
  const title = normalizeFieldTitle(field.fieldTitle);
  const name = normalizeFieldName(field.fieldName);

  return (
    title === 'locate your item' ||
    title.startsWith('locate your item') ||
    name === 'locateyouritem' ||
    name.includes('locateyouritem')
  );
};

/** Dynamic form field: "Building & Street Name" / "Building or Street name" */
export const isBuildingStreetField = (field: FormField): boolean => {
  const title = normalizeFieldTitle(field.fieldTitle);
  const name = normalizeFieldName(field.fieldName);

  return (
    title === 'building & street name' ||
    title === 'building or street name' ||
    title === 'building / street name' ||
    (title.includes('building') && title.includes('street')) ||
    name === 'buildingstreetname' ||
    name.includes('buildingstreet')
  );
};

export const findLocateYourItemField = (fields: FormField[]): FormField | undefined =>
  fields.find(isLocateYourItemField);

export const findBuildingStreetField = (fields: FormField[]): FormField | undefined =>
  fields.find(isBuildingStreetField);

/**
 * Index where the Confirm-your-location map should be inserted
 * (immediately before the first of locate/building fields).
 * Returns -1 when neither field exists.
 */
export const getLocationMapInsertIndex = (fields: FormField[]): number => {
  const indexes = fields
    .map((field, index) =>
      isLocateYourItemField(field) || isBuildingStreetField(field) ? index : -1,
    )
    .filter(index => index >= 0);

  if (!indexes.length) {
    return -1;
  }

  return Math.min(...indexes);
};
