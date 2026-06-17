import {
  DEFAULT_DYNAMIC_FORM_CATEGORY_ID,
  DYNAMIC_FORM_CATEGORY_ID_BY_SLUG,
  MOTORS_ROOT_CATEGORY_ID,
} from '../constants/createPostConstants';
import { CreatePostDraft } from '../types/createPost.types';
import { isMongoObjectId } from './mongoId';

export const resolveCategoryIdToObjectId = (value?: string): string | undefined => {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  if (isMongoObjectId(trimmed)) {
    return trimmed;
  }
  return DYNAMIC_FORM_CATEGORY_ID_BY_SLUG[trimmed];
};

export const resolveProductCategoryIds = (
  draft: Pick<CreatePostDraft, 'categoryId' | 'subcategoryId' | 'dynamicFormCategoryId'>,
): { categoryId: string; subcategoryId: string } => {
  const categoryId =
    resolveCategoryIdToObjectId(draft.categoryId) ??
    resolveCategoryIdToObjectId(draft.dynamicFormCategoryId) ??
    MOTORS_ROOT_CATEGORY_ID;

  const subcategoryId =
    resolveCategoryIdToObjectId(draft.subcategoryId) ??
    resolveCategoryIdToObjectId(draft.dynamicFormCategoryId) ??
    DEFAULT_DYNAMIC_FORM_CATEGORY_ID;

  return { categoryId, subcategoryId };
};
