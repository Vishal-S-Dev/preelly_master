/**
 * `Product.location` is often a raw address string passed straight through from the backend —
 * either dash-joined Google Places-style ("673C+W8M Car drop off - Burj Khalifa - Dubai -
 * United Arab Emirates") or comma-joined ("Near Nasik Road, Abu Dhabi, UAE") — but it can just
 * as easily be a plain city name or the literal "UAE" (see product.service.ts's Product
 * mapping). This tightens either delimited form down to its most specific, human-recognizable
 * segment (e.g. "Burj Khalifa", "Near Nasik Road") and otherwise returns the string as-is,
 * capped to a safe chip-display length either way.
 */

const PLUS_CODE_PATTERN = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}\b/i;

const UAE_EMIRATES = new Set([
  'dubai',
  'abu dhabi',
  'sharjah',
  'ajman',
  'ras al khaimah',
  'fujairah',
  'umm al quwain',
]);

const COUNTRY_NAMES = new Set(['united arab emirates', 'uae']);

const MAX_LABEL_LENGTH = 24;

const splitSegments = (raw: string): string[] => {
  const dashSegments = raw
    .split('-')
    .map(segment => segment.trim())
    .filter(Boolean);
  if (dashSegments.length > 1) {
    return dashSegments;
  }
  return raw
    .split(',')
    .map(segment => segment.trim())
    .filter(Boolean);
};

const truncate = (value: string): string =>
  value.length > MAX_LABEL_LENGTH ? `${value.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…` : value;

export const getShortLocationLabel = (location?: string | null): string => {
  const raw = (location ?? '').trim();
  if (!raw) {
    return '';
  }

  const segments = splitSegments(raw);
  if (segments.length <= 1) {
    return truncate(raw);
  }

  const meaningfulSegments = segments.filter(segment => {
    if (PLUS_CODE_PATTERN.test(segment)) {
      return false;
    }
    const normalized = segment.toLowerCase();
    return !UAE_EMIRATES.has(normalized) && !COUNTRY_NAMES.has(normalized);
  });

  return truncate(meaningfulSegments[0] ?? segments[0]);
};
