import { ProductAttributeDto } from '../../../../../data/dto/ProductDTO';
import { isMongoObjectId } from '../../../../../utils/mongoId';

export const normalizeEditFieldKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Canonical dynamic-form field names and alternate keys from product API payloads. */
export const PROPERTY_FIELD_ALIASES: Record<string, readonly string[]> = {
  '360yoururlid': ['360yoururlid', '360url', '360yoururl'],
  youtubeurlid: ['youtubeurlid', 'youtubeurl', 'youtube'],
  contactnumber: ['contactnumber', 'phonenumber', 'phone'],
  productprice: ['productprice', 'price'],
  reratitledeednumberid: ['reratitledeednumberid', 'reratitledeednumber'],
  sizename: ['sizename', 'size'],
  bedrooms: ['bedrooms', 'bedroomid', 'bedroom'],
  bathroomid: ['bathroomid', 'bathrooms', 'baths', 'bathroom'],
  furnishedstatus: ['furnishedstatus', 'furnished'],
  rentid: ['rentid', 'rent'],
  propertyreferenceid: ['propertyreferenceid', 'propertyrefid', 'propertyref'],
  reralandloardnameid: ['reralandloardnameid', 'reralandlordnameid'],
  rerapropertystatusid: ['rerapropertystatusid', 'rerapropertystatus'],
  rerapreregistrationnumberid: ['rerapreregistrationnumberid', 'rerapreregistrationnumber'],
  minimumcontractperiodid: ['minimumcontractperiodid', 'minimumcontactperiodid'],
  noticeperiodid: ['noticeperiodid', 'noticeperiod'],
  maintenancefeeid: ['maintenancefeeid', 'maintenancefee'],
  occupancystatusid: ['occupancystatusid', 'occupancystatus'],
  amenitiesid: ['amenitiesid', 'amenities'],
  location: ['location', 'locateyouritem'],
  listedbyid: ['listedbyid', 'listedby', 'listed-by'],
  cityid: ['cityid', 'city'],
  description: ['description', 'describe'],
  title: ['title'],
};

/** Normalized attribute titles from product detail → dynamic-form field names. */
export const PROPERTY_TITLE_TO_FIELD: Record<string, string> = {
  emirate: 'cityid',
  title: 'title',
  '360yoururl': '360yoururlid',
  youtubeurl: 'youtubeurlid',
  phonenumber: 'contactnumber',
  price: 'productprice',
  reratitledeednumber: 'reratitledeednumberid',
  describe: 'description',
  size: 'sizename',
  bedrooms: 'bedrooms',
  bathroom: 'bathroomid',
  isitfurnished: 'furnishedstatus',
  rentispaid: 'rentid',
  propertyreferenceid: 'propertyreferenceid',
  reralandloardname: 'reralandloardnameid',
  rerapropertystatus: 'rerapropertystatusid',
  rerapreregistrationnumber: 'rerapreregistrationnumberid',
  minimumcontractperiodinmonth: 'minimumcontractperiodid',
  noticeperiodinmonth: 'noticeperiodid',
  maintenancefee: 'maintenancefeeid',
  occupancystatus: 'occupancystatusid',
  amenities: 'amenitiesid',
  location: 'location',
  listedby: 'listedbyid',
};

const SKIPPED_ATTRIBUTE_KEYS = new Set(['category', 'subcategory', 'categorypath']);

export const isLikelyOptionId = (value: string): boolean => isMongoObjectId(value);

export const assignEditDynamicField = (
  fields: Record<string, string>,
  key: string,
  value?: string | number | null,
): void => {
  const next = value == null ? '' : String(value).trim();
  if (!next) {
    return;
  }

  const existing = fields[key]?.trim();
  if (!existing) {
    fields[key] = next;
    return;
  }

  if (isLikelyOptionId(next) && !isLikelyOptionId(existing)) {
    fields[key] = next;
  }
};

export const extractAiRawFields = (
  raw?: Record<string, unknown> | null,
): Record<string, string> => {
  const fields: Record<string, string> = {};
  if (!raw) {
    return fields;
  }

  Object.entries(raw).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    const text = String(value).trim();
    if (text) {
      assignEditDynamicField(fields, key.trim(), text);
    }
  });

  return fields;
};

export const mapAttributesToCanonicalFields = (
  attributes: ProductAttributeDto[],
): Record<string, string> => {
  const fields: Record<string, string> = {};

  attributes.forEach(attr => {
    const fieldKey = attr.fieldKey?.trim();
    const fieldValue = attr.fieldValue?.trim();
    if (!fieldValue) {
      return;
    }

    if (fieldKey && !SKIPPED_ATTRIBUTE_KEYS.has(fieldKey.toLowerCase())) {
      assignEditDynamicField(fields, fieldKey, fieldValue);
    }

    const titleKey = attr.fieldTitle ? normalizeEditFieldKey(attr.fieldTitle) : '';
    const canonicalFromTitle = titleKey ? PROPERTY_TITLE_TO_FIELD[titleKey] : undefined;
    if (canonicalFromTitle) {
      assignEditDynamicField(fields, canonicalFromTitle, fieldValue);
    }
  });

  return fields;
};

export const applyPropertyFieldAliases = (
  fields: Record<string, string>,
): Record<string, string> => {
  const next = { ...fields };

  Object.entries(PROPERTY_FIELD_ALIASES).forEach(([canonical, aliases]) => {
    if (next[canonical]?.trim()) {
      return;
    }

    for (const alias of aliases) {
      const direct = next[alias]?.trim();
      if (direct) {
        next[canonical] = direct;
        break;
      }

      const normalizedMatch = Object.entries(next).find(
        ([key, value]) =>
          normalizeEditFieldKey(key) === normalizeEditFieldKey(alias) && value?.trim(),
      );
      if (normalizedMatch) {
        next[canonical] = normalizedMatch[1].trim();
        break;
      }
    }
  });

  return next;
};

export const resolveEditFieldAliases = (
  fieldName: string,
  fields: Record<string, string>,
): string | undefined => {
  const normalizedName = normalizeEditFieldKey(fieldName);
  const aliasEntry =
    Object.entries(PROPERTY_FIELD_ALIASES).find(
      ([canonical, aliases]) =>
        normalizeEditFieldKey(canonical) === normalizedName ||
        aliases.some(alias => normalizeEditFieldKey(alias) === normalizedName),
    ) ?? null;

  const candidates = aliasEntry ? [aliasEntry[0], ...aliasEntry[1]] : [fieldName];

  for (const candidate of candidates) {
    const direct = fields[candidate]?.trim();
    if (direct) {
      return direct;
    }

    const match = Object.entries(fields).find(
      ([key, value]) =>
        normalizeEditFieldKey(key) === normalizeEditFieldKey(candidate) && value?.trim(),
    );
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return undefined;
};

export const resolveEditFieldByTitle = (
  fieldTitle: string,
  fields: Record<string, string>,
): string | undefined => {
  const titleKey = normalizeEditFieldKey(fieldTitle);
  const canonical = PROPERTY_TITLE_TO_FIELD[titleKey];
  if (!canonical) {
    return undefined;
  }
  return resolveEditFieldAliases(canonical, fields);
};
