import { useCallback, useEffect, useState } from 'react';
import { Product } from '../../domain/models/Product';
import { getProductDetailById } from '../../services/product.service';
import { ProductDetailView } from '../../types/product.types';

export const useProductDetail = (productId: string, seedProduct?: Product) => {
  const [detail, setDetail] = useState<ProductDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!productId) {
        setError('Missing product id');
        setLoading(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await getProductDetailById(productId, seedProduct);
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId, seedProduct],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const onRefresh = useCallback(() => load(true), [load]);

  return {
    detail,
    loading,
    refreshing,
    error,
    onRefresh,
    reload: load,
  };
};
