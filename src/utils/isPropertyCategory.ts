/** True when the selected create-post root category is Property. */
export const isPropertyCategory = (categoryName?: string): boolean =>
  categoryName?.trim().toLowerCase() === 'property';
