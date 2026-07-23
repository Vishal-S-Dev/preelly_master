import { API_ENDPOINTS } from '../../constants/appConstants';
import { CheckoutService } from '../../types/cartCheckout.types';
import { httpClient } from './httpClient';

export const CheckoutServiceApi = {
  async listActiveCheckoutServices(): Promise<CheckoutService[]> {
    const { data } = await httpClient.get<{ success?: boolean; data?: CheckoutService[] }>(
      API_ENDPOINTS.CHECKOUT_SERVICES,
    );
    return data?.data ?? [];
  },
};
