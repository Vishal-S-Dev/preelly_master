import { ProductApi } from '../data/api/ProductApi';
import { STORAGE_KEYS } from '../constants/appConstants';
import { CreatePostDraft } from '../types/createPost.types';
import { FormField } from '../types/dynamicForm.types';
import { buildProductFormData } from '../utils/buildProductFormData';
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

export const createPostService = {
  async publishListing(
    draft: CreatePostDraft,
    options?: { formFields?: FormField[] },
  ): Promise<{ id?: string }> {
    const contactName = await resolveContactName();
    const formData = buildProductFormData(draft, {
      contactName,
      formFields: options?.formFields,
    });
    return ProductApi.createProduct(formData);
  },
};
