/** True when the selected create-post root category is Classifieds. */
export const isClassifiedsCategory = (categoryName?: string): boolean =>
  categoryName?.trim().toLowerCase() === 'classifieds';
