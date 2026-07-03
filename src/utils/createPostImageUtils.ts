import { CreatePostImageAsset } from '../types/createPost.types';

const MOCK_IMAGE_PATTERNS = [
  /picsum\.photos/i,
  /placeholder/i,
  /via\.placeholder/i,
  /placehold\.co/i,
  /dummyimage/i,
  /pravatar\.cc/i,
  /loremflickr/i,
];

const isRenderableImageUri = (uri?: string): boolean => {
  if (!uri?.trim()) {
    return false;
  }
  const trimmed = uri.trim();
  if (MOCK_IMAGE_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  return /^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/)/i.test(trimmed);
};

/** Keep only real remote/local image URIs (no placeholders or mocks). */
export const filterRenderableImageUris = (images: string[]): string[] =>
  images.filter(isRenderableImageUri);

/** Keep only real screenshot / gallery URIs for create-post photo UI. */
export const filterRenderableCreatePostImages = (
  images: CreatePostImageAsset[],
): CreatePostImageAsset[] => images.filter(image => isRenderableImageUri(image.uri));
