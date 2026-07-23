export const PAY_VIA_PREELLY_FEE = 10;
export const PICK_DROP_FEE = 29.99;
export const PICK_DROP_DELIVERY_COST = 89.99;
export const PREELLY_PAY_CHARGE = 7;
export const VAT_PERCENT = 5;
export const MAX_PREELLY_CONDITIONS = 5;

export const PICK_DROP_TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '01:00 PM - 03:00 PM',
  '03:00 PM - 05:00 PM',
  '05:00 PM - 07:00 PM',
] as const;

export const DEFAULT_PICK_DROP_CENTER = {
  latitude: 25.2048,
  longitude: 55.2708,
};

export const PAY_PREELLY_FEATURES = [
  'Pick up form your place',
  'Drop to seller place (within 60 km of pickup location radius)',
  'Packaging included',
] as const;

export const PICK_DROP_FEATURES = [...PAY_PREELLY_FEATURES] as const;

export const FALLBACK_PREELLY_CONDITIONS = [
  'Odometer reading 1,05,000 KM',
  'Alarm / Anti-Theft System',
  'Sunroof',
  'Make & Model must match the add description',
  'No accident and flooded',
  'Daytime Running Lights (DRL)',
  'GCC Specification',
  'Exterior Colour White',
] as const;
