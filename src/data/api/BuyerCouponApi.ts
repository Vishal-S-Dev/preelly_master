import { API_ENDPOINTS } from '../../constants/appConstants';
import { BuyerCouponValidation, CartCheckoutServiceRow } from '../../types/cartCheckout.types';
import { httpClient } from './httpClient';

export const BuyerCouponApi = {
  async validate(params: {
    couponCode: string;
    services: Array<{ checkoutServiceId: string; amount: number }>;
  }): Promise<BuyerCouponValidation> {
    const { data } = await httpClient.post<{ success?: boolean; data?: BuyerCouponValidation }>(
      API_ENDPOINTS.BUYER_COUPON_VALIDATE,
      params,
    );
    return data?.data ?? { valid: false, discountAmount: 0 };
  },

  async validateFromRows(
    couponCode: string,
    rows: CartCheckoutServiceRow[],
  ): Promise<BuyerCouponValidation> {
    return BuyerCouponApi.validate({
      couponCode,
      services: rows.map(row => ({
        checkoutServiceId: row.id,
        amount: row.fee,
      })),
    });
  },
};
