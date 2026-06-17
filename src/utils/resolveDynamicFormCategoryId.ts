import {
  DEFAULT_DYNAMIC_FORM_CATEGORY_ID,
  DYNAMIC_FORM_CATEGORY_ID_BY_SLUG,
} from '../constants/createPostConstants';
import { isMongoObjectId } from './mongoId';

const resolveCandidate = (id?: string): string | undefined => {
  if (!id?.trim()) {
    return undefined;
  }
  const trimmed = id.trim();
  if (isMongoObjectId(trimmed)) {
    return trimmed;
  }
  return DYNAMIC_FORM_CATEGORY_ID_BY_SLUG[trimmed];
};

export const resolveDynamicFormCategoryId = (
  subcategoryId?: string,
  categoryId?: string,
): string =>
  resolveCandidate(subcategoryId) ??
  resolveCandidate(categoryId) ??
  DEFAULT_DYNAMIC_FORM_CATEGORY_ID;
