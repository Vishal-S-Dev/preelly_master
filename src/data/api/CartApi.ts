import { API_ENDPOINTS } from '../../constants/appConstants';
import { CartItem } from '../../types/cartCheckout.types';
import { httpClient } from './httpClient';

export type CartApiCartProductId = string | { _id?: string; id?: string };

export type CartItemDTO = CartItem;

const resolveProductId = (productId: CartApiCartProductId | undefined | null): string => {
  if (!productId) return '';
  if (typeof productId === 'string') return productId;
  return String(productId._id ?? productId.id ?? '');
};

export const CartApi = {
  /**
   * Add the product of a chat to the buyer's cart when an offer is accepted.
   * Backend: POST /api/cart/from-offer { chatId, amount }
   */
  async addFromOffer(chatId: string, amount: number): Promise<void> {
    await httpClient.post(API_ENDPOINTS.CART_ADD_FROM_OFFER, { chatId, amount });
  },

  /**
   * Get the current user's active cart items.
   * Backend: GET /api/cart → { success, data: CartItem[] }
   */
  async getCart(): Promise<CartItemDTO[]> {
    const { data } = await httpClient.get<{ success?: boolean; data?: CartItemDTO[] }>(
      API_ENDPOINTS.CART,
    );
    return data?.data ?? [];
  },

  resolveProductId,
};

