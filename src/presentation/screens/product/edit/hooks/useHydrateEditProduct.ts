import { useCallback, useState } from 'react';
import { ProductApi } from '../../../../../data/api/ProductApi';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { EditProductDetailSeed } from '../../../../../types/editProduct.types';
import { applyEditProductSeed } from '../mapper/applyEditProductSeed';
import { mapProductDtoToEditDraft } from '../mapper/mapProductDtoToEditDraft';

export const useHydrateEditProduct = () => {
  const initFromDraft = useEditProductStore(state => state.initFromDraft);
  const reset = useEditProductStore(state => state.reset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(
    async (productId: string, seed?: EditProductDetailSeed) => {
      setLoading(true);
      setError(null);
      try {
        reset();
        const dto = await ProductApi.getProductById(productId);
        const mapped = mapProductDtoToEditDraft(dto);
        const draft = applyEditProductSeed(mapped, seed);
        initFromDraft(draft);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initFromDraft, reset],
  );

  return { hydrate, loading, error };
};
