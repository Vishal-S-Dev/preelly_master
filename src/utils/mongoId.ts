const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const isMongoObjectId = (value?: string | null): value is string =>
  Boolean(value?.trim() && OBJECT_ID_PATTERN.test(value.trim()));
