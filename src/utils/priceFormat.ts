/** Indian numbering: last 3 digits, then groups of 2 (e.g. 2,50,000). */
export const formatIndianNumber = (value: number): string => {
  const safe = Math.max(0, Math.floor(value));
  const str = String(safe);
  if (str.length <= 3) {
    return str;
  }
  const lastThree = str.slice(-3);
  const head = str.slice(0, -3);
  const groups: string[] = [];
  let index = head.length;
  while (index > 0) {
    const start = Math.max(0, index - 2);
    groups.unshift(head.slice(start, index));
    index = start;
  }
  return `${groups.join(',')},${lastThree}`;
};

export const parsePriceInput = (text: string): number => {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) {
    return NaN;
  }
  return Number(digits);
};

export const formatPriceDigits = (digits: string): string => {
  if (!digits) {
    return '';
  }
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) {
    return '';
  }
  return formatIndianNumber(parsed);
};
