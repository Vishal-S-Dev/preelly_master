/** Ported verbatim from web's SavedCardModal.jsx — framework-agnostic. */

export const formatCardInput = (value: string): string => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

export const formatExpiryInput = (value: string): string => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const detectCardBrand = (digits: string): string => {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return '';
};

export const isValidLuhn = (num: string): boolean => {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

export interface CardFormErrors {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  holderName?: string;
}

/** Mirrors web's SavedCardModal.validate() exactly. */
export const validateCardForm = (options: {
  isEditing: boolean;
  digits: string;
  brand: string;
  expiry: string;
  cvv: string;
  holderName: string;
}): CardFormErrors => {
  const { isEditing, digits, brand, expiry, cvv, holderName } = options;
  const errors: CardFormErrors = {};

  const cardNumberInvalid = digits.length < 12 || digits.length > 19 || !isValidLuhn(digits);
  if (!isEditing) {
    if (cardNumberInvalid) {
      errors.cardNumber = 'Enter a valid card number';
    }
  } else if (digits && cardNumberInvalid) {
    errors.cardNumber = 'Enter a valid card number';
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    errors.expiry = 'Use MM/YY format';
  } else {
    const [mm, yy] = expiry.split('/').map(Number);
    const now = new Date();
    const exp = new Date(2000 + yy, mm);
    if (mm < 1 || mm > 12 || exp <= now) {
      errors.expiry = 'Card is expired or invalid';
    }
  }

  if (!isEditing || cvv) {
    const amex = brand === 'American Express' || /^3[47]/.test(digits);
    const cvvInvalid = !/^\d{3,4}$/.test(cvv) || (amex ? cvv.length !== 4 : cvv.length !== 3);
    if (cvvInvalid) {
      errors.cvv = amex ? 'Enter 4-digit CVV' : 'Enter 3-digit CVV';
    }
  }

  if (!holderName.trim()) {
    errors.holderName = 'Name on card is required';
  }

  return errors;
};
