import { EditProductImageAsset } from '../../../../../types/editProduct.types';
import { filterRenderableCreatePostImages } from '../../../../../utils/createPostImageUtils';

const MOCK_IMAGE_PATTERNS = [
  /picsum\.photos/i,
  /placeholder/i,
  /via\.placeholder/i,
  /placehold\.co/i,
  /dummyimage/i,
  /pravatar\.cc/i,
  /loremflickr/i,
];

const isMockImageUri = (uri?: string): boolean => {
  if (!uri?.trim()) {
    return true;
  }
  return MOCK_IMAGE_PATTERNS.some(pattern => pattern.test(uri.trim()));
};

/** Edit flow: real product / gallery / captured frames only — no placeholders or mocks. */
export const filterEditProductImages = (
  images: EditProductImageAsset[],
): EditProductImageAsset[] =>
  filterRenderableCreatePostImages(images).filter(image => !isMockImageUri(image.uri));
