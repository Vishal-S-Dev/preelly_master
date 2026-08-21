/**
 * The API never sends an icon per product attribute/quickView field (confirmed against both
 * `ProductAttributeDto` and the web reference, which also hardcodes icons client-side per known
 * field name — see `detailHelpers.js`'s chip builder). This mirrors that approach: a curated
 * fieldKey/fieldTitle → MaterialCommunityIcons lookup, so dynamic, category-specific fields
 * (cars, property, electronics, ...) still get a sensible icon instead of one generic fallback.
 */

const normalizeFieldKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const FIELD_ICON_MAP: Record<string, string> = {
  year: 'calendar-blank-outline',
  manufacturingyear: 'calendar-blank-outline',
  mileage: 'speedometer',
  kilometers: 'speedometer',
  kilometres: 'speedometer',
  regionalspecs: 'earth',
  targetmarket: 'earth',
  fueltype: 'gas-station-outline',
  transmissiontype: 'car-shift-pattern',
  transmission: 'car-shift-pattern',
  bodytype: 'car-side',
  doors: 'car-door',
  numberofcylenders: 'engine-outline',
  cylinders: 'engine-outline',
  horsepower: 'gauge',
  enginecapacity: 'engine',
  exteriorcolor: 'palette-outline',
  interiorcolor: 'palette-swatch-outline',
  warranty: 'shield-check-outline',
  trim: 'car-cog',
  steeringside: 'steering',
  seats: 'seat-passenger',
  seatingcapacity: 'seat-passenger',
  condition: 'star-check-outline',
  isinsured: 'shield-check-outline',
  bedrooms: 'bed-outline',
  bathrooms: 'shower',
  area: 'ruler-square',
  size: 'ruler-square',
  furnished: 'sofa-outline',
  postedon: 'calendar-check-outline',
  location: 'map-marker-outline',
  brand: 'tag-outline',
  model: 'car-info',
};

export const getProductFieldIcon = (fieldKey?: string, fieldTitle?: string): string => {
  const byKey = fieldKey ? FIELD_ICON_MAP[normalizeFieldKey(fieldKey)] : undefined;
  if (byKey) {
    return byKey;
  }
  const byTitle = fieldTitle ? FIELD_ICON_MAP[normalizeFieldKey(fieldTitle)] : undefined;
  return byTitle ?? 'information-outline';
};
