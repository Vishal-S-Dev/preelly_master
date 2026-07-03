import { CreatePostDraft, CreatePostImageAsset } from './createPost.types';

/** Serializable snapshot from product detail for edit-flow prefill. */
export interface EditProductDetailSeed {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  contactPhone?: string;
  locationAddress?: string;
  locateYourItem?: string;
}

/** Image asset with optional server-side path tracking for edit flow. */
export interface EditProductImageAsset extends CreatePostImageAsset {
  isRemote?: boolean;
  remotePath?: string;
}

export interface EditProductDraft extends CreatePostDraft {
  productId?: string;
  categoryPath?: string[];
  currency?: string;
  remoteVideoUrl?: string;
  removedRemoteImagePaths?: string[];
  images: EditProductImageAsset[];
}

export type EditProductStackParamList = {
  EditProductHydrate: {
    productId: string;
    initialRoute?: Exclude<keyof EditProductStackParamList, 'EditProductHydrate'>;
    detailSeed?: EditProductDetailSeed;
  };
  EditProductCategory: undefined;
  EditProductSubcategory: undefined;
  EditProductMediaStep: undefined;
  EditProductDetailsStep: undefined;
  EditProductFormStep: undefined;
  EditProductAdvancedFormStep: undefined;
  EditProductPreviewStep: undefined;
};
