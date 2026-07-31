import { Category } from '../types/category.types';

/**
 * API `isChild`:
 * - 1 / true / "1" → category has nested children (open another subcategory screen)
 * - 0 / false / missing → leaf category (continue to media upload)
 */
export const categoryHasChildren = (category: Pick<Category, 'isChild'>): boolean => {
  const value = category.isChild;
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }
  return false;
};
