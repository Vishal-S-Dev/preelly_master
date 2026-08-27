import { API_ENDPOINTS } from '../../constants/appConstants';
import { DeliveryPriceCalculation, DeliveryPriceRequest } from '../../types/cartCheckout.types';
import { httpClient } from './httpClient';

export const DeliveryApi = {
  async calculatePrice(payload: DeliveryPriceRequest): Promise<DeliveryPriceCalculation> {
    const { data } = await httpClient.post<{
      success?: boolean;
      message?: string;
      data?: DeliveryPriceCalculation;
    }>(API_ENDPOINTS.DELIVERY_CALCULATE_PRICE, payload);

    if (!data?.success || !data.data) {
      throw new Error(data?.message ?? 'Unable to calculate delivery price.');
    }

    return data.data;
  },
};
