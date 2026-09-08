import { ProductApi } from '../data/api/ProductApi';
import { STORAGE_KEYS } from '../constants/appConstants';
import { CreatePostDraft } from '../types/createPost.types';
import { FormField } from '../types/dynamicForm.types';
import { buildProductFormData } from '../utils/buildProductFormData';
import { compressVideoForUpload } from '../utils/videoCompression';
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
    // Compressed only at the point of upload — preview/trim keep working against the original
    // file untouched, this just shrinks what actually goes over the wire.
    const uploadDraft = draft.video
      ? { ...draft, video: await compressVideoForUpload(draft.video) }
      : draft;
    const formData = buildProductFormData(uploadDraft, {
      contactName,
      formFields: options?.formFields,
    });
    return ProductApi.createProduct(formData);
  },
};
