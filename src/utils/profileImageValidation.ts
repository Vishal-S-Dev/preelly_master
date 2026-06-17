const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpg', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

export interface SelectedProfileImage {
  uri?: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

const hasAllowedExt = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXT.some(ext => lower.endsWith(ext));
};

export const validateProfileImage = (
  image: SelectedProfileImage,
): { valid: boolean; error?: string } => {
  if (!image.uri) {
    return { valid: false, error: 'Selected file is not accessible.' };
  }
  if (!image.type && !image.fileName) {
    return { valid: false, error: 'Unsupported file format. Please choose JPG, PNG, or WEBP.' };
  }

  const typeValid = image.type ? ALLOWED_TYPES.has(image.type.toLowerCase()) : true;
  const extValid = image.fileName ? hasAllowedExt(image.fileName) : true;
  if (!typeValid && !extValid) {
    return { valid: false, error: 'Unsupported file format. Please choose JPG, PNG, or WEBP.' };
  }

  if (typeof image.fileSize === 'number' && image.fileSize > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image is too large. Maximum allowed size is 8 MB.' };
  }

  return { valid: true };
};

export const toUploadableProfileImage = (image: SelectedProfileImage) => {
  const fallbackName = `profile_${Date.now()}.jpg`;
  const normalizedType = (image.type || 'image/jpeg').toLowerCase() === 'image/jpg'
    ? 'image/jpeg'
    : image.type || 'image/jpeg';
  return {
    uri: image.uri as string,
    type: normalizedType,
    fileName: image.fileName || fallbackName,
  };
};
