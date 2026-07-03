import { ProductApi } from '../data/api/ProductApi';
import { STORAGE_KEYS } from '../constants/appConstants';
import { EditProductDraft } from '../types/editProduct.types';
import { FormField } from '../types/dynamicForm.types';
import { buildEditProductFormData } from '../utils/buildEditProductFormData';
import { storage } from '../utils/storage';

const resolveContactName = async (): Promise<string | undefined> => {
  try {
    const userJson = await storage.getString(STORAGE_KEYS.USER_DATA);
    if (!userJson) {
      return undefined;
    }
    const user = JSON.parse(userJson) as { name?: string };
    return user.name?.trim() || undefined;
  } catch {
    return undefined;
  }
};

export const editProductService = {
  async updateListing(
    draft: EditProductDraft,
    options?: { formFields?: FormField[] },
  ): Promise<{ id?: string }> {
    const productId = draft.productId?.trim();
    if (!productId) {
      throw new Error('Missing product id');
    }
    const contactName = await resolveContactName();
    const formData = buildEditProductFormData(draft, {
      contactName,
      formFields: options?.formFields,
    });
    return ProductApi.updateProduct(productId, formData);
  },
};
