import { useCallback, useMemo } from 'react';
import { useCreatePostStore } from '../../store/createPostStore';
import { roundMoney } from '../../utils/checkoutTotals';

export interface DraftListing {
  title: string;
  categoryLabel: string;
  priceLabel: string;
  thumbnailUri: string | null;
}

const formatDraftPrice = (price: string): string => {
  const value = Number(price);
  if (!price || !Number.isFinite(value) || value <= 0) {
    return 'Price not set';
  }
  return `AED ${roundMoney(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

export const useMyDrafts = () => {
  const title = useCreatePostStore(state => state.title);
  const price = useCreatePostStore(state => state.price);
  const images = useCreatePostStore(state => state.images);
  const video = useCreatePostStore(state => state.video);
  const categoryName = useCreatePostStore(state => state.categoryName);
  const subcategoryName = useCreatePostStore(state => state.subcategoryName);
  const reset = useCreatePostStore(state => state.reset);

  const hasDraft = Boolean(title.trim() || images.length > 0 || video);

  const draft = useMemo<DraftListing | null>(() => {
    if (!hasDraft) {
      return null;
    }
    return {
      title: title.trim() || subcategoryName || categoryName || 'Untitled draft',
      categoryLabel: subcategoryName || categoryName || 'Category not set',
      priceLabel: formatDraftPrice(price),
      thumbnailUri: images[0]?.uri ?? null,
    };
  }, [categoryName, hasDraft, images, price, subcategoryName, title]);

  const deleteDraft = useCallback(() => {
    reset();
  }, [reset]);

  return { draft, deleteDraft };
};
