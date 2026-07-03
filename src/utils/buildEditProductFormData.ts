import { FormField } from '../../../types/dynamicForm.types';
import { EditProductDraft } from '../../../types/editProduct.types';
import { buildProductFormData, BuildProductFormOptions } from './buildProductFormData';

export interface BuildEditProductFormOptions extends BuildProductFormOptions {
  formFields?: FormField[];
}

const appendJsonField = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) {
    return;
  }
  formData.append(key, JSON.stringify(value));
};

export const buildEditProductFormData = (
  draft: EditProductDraft,
  options: BuildEditProductFormOptions = {},
): FormData => {
  const localImages = draft.images.filter(image => !image.isRemote);
  const keptExistingImages = draft.images
    .filter(image => image.isRemote && image.remotePath?.trim())
    .map(image => image.remotePath!.trim());

  const draftForPayload: EditProductDraft = {
    ...draft,
    images: localImages,
    video: draft.video ?? null,
  };

  const formData = buildProductFormData(draftForPayload, options);

  appendJsonField(formData, 'existingImages', keptExistingImages);

  if (draft.categoryPath?.length) {
    appendJsonField(formData, 'categoryPath', draft.categoryPath);
  }

  if (draft.currency?.trim()) {
    formData.append('currency', draft.currency.trim());
  }

  return formData;
};
