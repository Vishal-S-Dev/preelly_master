import { formatPinCountLabel, formatRelativeTimeShort } from '../src/utils/relativeTime';

describe('formatRelativeTimeShort', () => {
  it('returns empty string for missing/invalid input', () => {
    expect(formatRelativeTimeShort(undefined)).toBe('');
    expect(formatRelativeTimeShort(null)).toBe('');
    expect(formatRelativeTimeShort('not-a-date')).toBe('');
  });

  it('formats minutes, hours, days, months and years', () => {
    const now = Date.now();
    expect(formatRelativeTimeShort(new Date(now - 30 * 1000).toISOString())).toBe('Just now');
    expect(formatRelativeTimeShort(new Date(now - 5 * 60 * 1000).toISOString())).toBe('5m');
    expect(formatRelativeTimeShort(new Date(now - 3 * 60 * 60 * 1000).toISOString())).toBe('3h');
    expect(formatRelativeTimeShort(new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString())).toBe('2d');
    expect(
      formatRelativeTimeShort(new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString()),
    ).toBe('2mo');
    expect(
      formatRelativeTimeShort(new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString()),
    ).toBe('1y');
  });
});

describe('formatPinCountLabel', () => {
  it('uses singular for exactly one item', () => {
    expect(formatPinCountLabel(1)).toBe('1 Pin');
  });

  it('uses plural for zero or many items', () => {
    expect(formatPinCountLabel(0)).toBe('0 Pins');
    expect(formatPinCountLabel(26)).toBe('26 Pins');
  });
});
