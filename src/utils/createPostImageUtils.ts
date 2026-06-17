import { CreatePostImageAsset } from '../types/createPost.types';

const PLACEHOLDER_IMAGE_PATTERN = /picsum\.photos/i;

const isRenderableImageUri = (uri?: string): boolean => {
  if (!uri?.trim()) {
    return false;
  }
  if (PLACEHOLDER_IMAGE_PATTERN.test(uri)) {
    return false;
  }
  return /^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/)/i.test(uri.trim());
};

/** Keep only real screenshot / gallery URIs for create-post photo UI. */
export const filterRenderableCreatePostImages = (
  images: CreatePostImageAsset[],
): CreatePostImageAsset[] => images.filter(image => isRenderableImageUri(image.uri));
