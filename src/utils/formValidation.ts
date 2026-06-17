const UAE_PHONE_PATTERN = /^(\+971|00971|971|0)?5[0-9]{8}$/;

export const validateUaePhone = (value: string): boolean => {
  const normalized = value.replace(/[\s-]/g, '');
  return UAE_PHONE_PATTERN.test(normalized);
};

export const validatePrice = (value: string): boolean => {
  const num = Number(value.replace(/,/g, ''));
  return Number.isFinite(num) && num >= 0;
};

export const validateYear = (value: string): boolean => {
  const year = Number(value);
  const maxYear = new Date().getFullYear() + 1;
  return Number.isInteger(year) && year >= 1900 && year <= maxYear;
};
