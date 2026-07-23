import { Platform } from 'react-native';

/** 1 = Ads payment, 2 = Product checkout (buyer cart). */
export const PAYMENT_TYPE = {
  ADS: 1,
  CHECKOUT: 2,
} as const;

/** 1 = Web, 2 = Android, 3 = iOS */
export const PAYMENT_FROM = {
  WEB: 1,
  ANDROID: 2,
  IOS: 3,
} as const;

export type PaymentFrom = (typeof PAYMENT_FROM)[keyof typeof PAYMENT_FROM];

export const resolvePaymentFrom = (): PaymentFrom => {
  if (Platform.OS === 'ios') {
    return PAYMENT_FROM.IOS;
  }
  if (Platform.OS === 'android') {
    return PAYMENT_FROM.ANDROID;
  }
  return PAYMENT_FROM.WEB;
};
