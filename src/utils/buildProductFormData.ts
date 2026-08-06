import { FormField } from '../types/dynamicForm.types';
import { CreatePostDraft } from '../types/createPost.types';
import {
  flattenFormFields,
  resolveDropdownDisplayLabel,
  resolveDynamicFieldsForApi,
} from './dynamicFormUtils';
import { isMongoObjectId } from './mongoId';
import { resolveProductCategoryIds } from './resolveProductCategoryIds';
import {
  isPromotedListingFieldKey,
  resolveListingPhone,
  resolveListingPrice,
} from './resolveListingPrice';

export interface BuildProductFormOptions {
  contactName?: string;
  formFields?: FormField[];
}

const DEFAULT_COUNTRY = 'UAE';
const DEFAULT_CURRENCY = 'AED';

const normalizeApiFieldKey = (key: string): string => key.toLowerCase();

const appendIfPresent = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) {
    return;
  }
  const text = String(value).trim();
  if (!text) {
    return;
  }
  formData.append(key, text);
};

const findFieldByName = (fields: FormField[], name: string): FormField | undefined =>
  fields.find(field => normalizeApiFieldKey(field.fieldName) === normalizeApiFieldKey(name));

const resolveFieldLabel = (
  fields: FormField[],
  fieldName: string,
  values: Record<string, string>,
): string | undefined => {
  const field = findFieldByName(fields, fieldName);
  if (!field) {
    return undefined;
  }
  return resolveDropdownDisplayLabel(field, values[field.fieldName], fields, values);
};

/**
 * Some categories' dynamic-form API exposes the Year dropdown under fieldName "year"
 * (not "yearId"), with `option.value` being a Filter ObjectId rather than the literal
 * year — while the backend's Product schema expects `year` to be a plain Number. Resolve
 * the dropdown's display label (e.g. "2026") instead of forwarding the raw ObjectId, which
 * would fail with a Mongoose "Cast to Number" error.
 */
const resolveManufacturingYear = (
  formFields: FormField[],
  dynamicFields: Record<string, string>,
): string | undefined => {
  const yearField = findFieldByName(formFields, 'year') ?? findFieldByName(formFields, 'yearid');
  if (!yearField) {
    return undefined;
  }
  const rawValue = dynamicFields[yearField.fieldName];
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!isMongoObjectId(rawValue)) {
    return /^\d{4}$/.test(trimmed) ? trimmed : undefined;
  }
  const label = resolveDropdownDisplayLabel(yearField, rawValue, formFields, dynamicFields)?.trim();
  return label && /^\d{4}$/.test(label) ? label : undefined;
};

const extractBrandFromModel = (modelLabel?: string): string | undefined => {
  if (!modelLabel) {
    return undefined;
  }
  const dotParts = modelLabel.split('.').map(part => part.trim()).filter(Boolean);
  if (dotParts.length > 1) {
    return dotParts[0];
  }
  const spaceParts = modelLabel.split(' ').filter(Boolean);
  return spaceParts[0];
};

const resolveLocationParts = (
  draft: CreatePostDraft,
  formFields: FormField[],
  dynamicFields: Record<string, string>,
) => {
  const cityLabel = resolveFieldLabel(formFields, 'cityid', dynamicFields);
  const area = draft.locateYourItem?.trim() || cityLabel || '';
  const city = cityLabel ?? 'Dubai';
  const country = DEFAULT_COUNTRY;
  const buildingStreet = draft.locationAddress?.trim() ?? '';
  const landmark = draft.locateYourItem?.trim() ?? '';
  const location = [area, city, country].filter(Boolean).join(', ');

  return { location, country, city, area, buildingStreet, landmark };
};

const STATIC_DEFAULTS: Record<string, string> = {
  condition: 'Good',
  priceType: 'Fixed',
  adType: 'free',
};

/**
 * Backend vehicle-listing fields that only ever store a Filter/Category ObjectId
 * (see api/utils/productVehicleFields.js VEHICLE_LISTING_FIELDS). AI/transcript
 * extraction can populate the matching dynamicFields key with raw label text
 * (e.g. "Petrol") before the user confirms it via the dropdown — sending that
 * text here would fail the ObjectId cast server-side, so skip unresolved values
 * the same way `category`/`subcategory` are already guarded below.
 */
const VEHICLE_OBJECT_ID_API_KEYS = new Set([
  'cityid',
  'modelid',
  'trimid',
  'regionalspecsid',
  'yearid',
  'bodytypeid',
  'seatid',
  'isinsuredid',
  'exteriorcolorid',
  'interiorcolorid',
  'warrantyid',
  'fueltypeid',
  'doorsid',
  'numberofcylenderid',
  'transmissiontypeid',
  'horsepowerid',
  'steeringsideid',
  'enginecapacityid',
  'driverassistancesafetyid',
  'entertainmenttechnologyid',
  'comfortconvenienceid',
  'exteriorid',
]);

const LEGACY_FIELD_MAP: Record<string, string> = {
  exteriorColor: 'exteriorcolorid',
  interiorColor: 'interiorcolor',
  warranty: 'warrantyid',
  fuelType: 'fueltypeid',
  insuredInUae: 'isinsuredid',
};

export const buildProductFormData = (
  draft: CreatePostDraft,
  options: BuildProductFormOptions = {},
): FormData => {
  const formData = new FormData();
  const formFields = options.formFields ?? [];
  const dynamicFields = formFields.length
    ? resolveDynamicFieldsForApi(formFields, { ...draft.dynamicFields })
    : { ...draft.dynamicFields };
  const phone = resolveListingPhone(draft, dynamicFields, formFields);
  const price = resolveListingPrice(draft, dynamicFields, formFields);
  const { location, country, city, area, buildingStreet, landmark } = resolveLocationParts(
    draft,
    formFields,
    dynamicFields,
  );
  const modelLabel = resolveFieldLabel(formFields, 'modelid', dynamicFields);
  const brand = extractBrandFromModel(modelLabel);
  const manufacturingYear = resolveManufacturingYear(formFields, dynamicFields);
  const { categoryId, subcategoryId } = resolveProductCategoryIds(draft);

  if (draft.video) {
    formData.append('video', {
      uri: draft.video.uri,
      name: draft.video.name,
      type: draft.video.type,
    } as unknown as Blob);
  }

  draft.images.forEach((image, index) => {
    formData.append('images', {
      uri: image.uri,
      name: `photo_${index}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  appendIfPresent(formData, 'title', draft.title);
  appendIfPresent(formData, 'description', draft.description);
  if (price) {
    appendIfPresent(formData, 'price', price);
    appendIfPresent(formData, 'productprice', price);
  }
  appendIfPresent(formData, 'currency', DEFAULT_CURRENCY);
  appendIfPresent(formData, 'category', categoryId);
  appendIfPresent(formData, 'subcategory', subcategoryId);
  appendIfPresent(formData, 'location', location);
  appendIfPresent(formData, 'country', country);
  appendIfPresent(formData, 'city', city);
  appendIfPresent(formData, 'area', area);
  appendIfPresent(formData, 'locateyouritem', landmark);
  appendIfPresent(formData, 'buildingstreetname', buildingStreet);
  appendIfPresent(formData, 'brand', brand);
  appendIfPresent(formData, 'year', manufacturingYear);
  appendIfPresent(formData, 'contactName', options.contactName);
  appendIfPresent(formData, 'contactPhone', phone);
  appendIfPresent(formData, 'phonenumber', phone);

  Object.entries(STATIC_DEFAULTS).forEach(([key, value]) => {
    appendIfPresent(formData, key, value);
  });

  const appendedKeys = new Set<string>([
    'title',
    'description',
    'currency',
    'category',
    'subcategory',
    'location',
    'country',
    'city',
    'area',
    'locateyouritem',
    'buildingstreetname',
    'brand',
    'year',
    'condition',
    'pricetype',
    'adtype',
    'video',
    'images',
  ]);

  if (price) {
    appendedKeys.add('price');
    appendedKeys.add('productprice');
  }
  if (phone) {
    appendedKeys.add('contactphone');
    appendedKeys.add('phonenumber');
  }
  if (options.contactName?.trim()) {
    appendedKeys.add('contactname');
  }

  const hasDynamicValue = (apiKey: string): boolean =>
    Object.entries(dynamicFields).some(
      ([key, value]) => normalizeApiFieldKey(key) === apiKey && Boolean(value?.trim()),
    );

  Object.entries(LEGACY_FIELD_MAP).forEach(([storeKey, apiKey]) => {
    const storeValue = draft[storeKey as keyof CreatePostDraft];
    if (
      typeof storeValue === 'string' &&
      storeValue.trim() &&
      !hasDynamicValue(apiKey) &&
      !appendedKeys.has(apiKey) &&
      !(VEHICLE_OBJECT_ID_API_KEYS.has(apiKey) && !isMongoObjectId(storeValue))
    ) {
      appendIfPresent(formData, apiKey, storeValue);
      appendedKeys.add(apiKey);
    }
  });

  Object.entries(dynamicFields).forEach(([fieldName, value]) => {
    const apiKey = normalizeApiFieldKey(fieldName);
    if (appendedKeys.has(apiKey)) {
      return;
    }
    // Price/phone are sent as top-level `price` / `contactPhone` — skip duplicate dynamic keys.
    if (isPromotedListingFieldKey(apiKey)) {
      return;
    }
    if (
      (apiKey === 'category' || apiKey === 'subcategory' || VEHICLE_OBJECT_ID_API_KEYS.has(apiKey)) &&
      !isMongoObjectId(value)
    ) {
      return;
    }
    appendIfPresent(formData, apiKey, value);
    appendedKeys.add(apiKey);
  });

  return formData;
};

export const getProductFormFields = (steps: { step: number; fields: FormField[] }[] | undefined): FormField[] =>
  steps ? flattenFormFields(steps) : [];
