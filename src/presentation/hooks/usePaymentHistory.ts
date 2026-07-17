import { useCallback, useEffect, useState } from 'react';
import { paymentService } from '../../services/payment.service';
import { PaymentTransaction } from '../../types/payment.types';
import { getPaymentErrorMessage } from '../../utils/paymentUtils';

export const usePaymentHistory = () => {
  const [items, setItems] = useState<PaymentTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (nextPage: number, mode: 'replace' | 'append' | 'refresh') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else if (mode === 'append') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await paymentService.getTransactions({
          page: nextPage,
          limit: 10,
          search: search.trim() || undefined,
        });
        setPage(result.page);
        setHasMore(result.hasMore);
        setItems(prev =>
          mode === 'append' ? [...prev, ...result.items] : result.items,
        );
      } catch (err) {
        setError(getPaymentErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [search],
  );

  useEffect(() => {
    load(1, 'replace');
  }, [load]);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    load(page + 1, 'append');
  }, [hasMore, load, loading, loadingMore, page]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    search,
    setSearch,
    refresh,
    loadMore,
    reload: () => load(1, 'replace'),
  };
};
