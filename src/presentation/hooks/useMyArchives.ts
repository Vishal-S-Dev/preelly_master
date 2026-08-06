import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductApi } from '../../data/api/ProductApi';
import { ArchivedListing, ArchiveSortKey } from '../../types/archives.types';
import { roundMoney } from '../../utils/checkoutTotals';

const LIMIT = 12;

const formatPrice = (value: number, currency = 'AED'): string =>
  `${currency} ${roundMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const mapListing = (dto: {
  _id: string;
  title?: string;
  price?: number;
  currency?: string;
  images?: string[];
  location?: string;
  category?: { name?: string };
  archivedAt?: string | null;
  updatedAt?: string;
}): ArchivedListing => ({
  id: dto._id,
  title: dto.title?.trim() || 'Untitled ad',
  priceLabel: formatPrice(dto.price ?? 0, dto.currency?.toUpperCase()),
  categoryName: dto.category?.name || 'Uncategorized',
  location: dto.location || null,
  imageUrl: dto.images?.[0] ? ProductApi.withBase(dto.images[0]) : null,
  archivedAt: dto.archivedAt ?? null,
  updatedAt: dto.updatedAt ?? null,
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) {
      return response.data.message.trim();
    }
  }
  return fallback;
};

export const useMyArchives = () => {
  const [items, setItems] = useState<ArchivedListing[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ArchiveSortKey>('archived_newest');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, mode: 'replace' | 'append' | 'refresh' | 'silent') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else if (mode === 'append') {
        setLoadingMore(true);
      } else if (mode === 'replace') {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await ProductApi.getMyListings({
          archived: true,
          page: nextPage,
          limit: LIMIT,
          q: search.trim() || undefined,
          sort,
        });
        const mapped = result.items.map(mapListing);
        setPage(result.page);
        setTotal(result.total);
        setHasMore(result.page < result.totalPages);
        setItems(prev => (mode === 'append' ? [...prev, ...mapped] : mapped));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load archives'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [search, sort],
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

  const restore = useCallback(
    async (id: string): Promise<{ message: string }> => {
      setBusyId(id);
      try {
        await ProductApi.restoreProduct(id);
        await load(page, 'silent');
        return { message: 'Ad restored to My Ads' };
      } catch (err) {
        throw new Error(getErrorMessage(err, 'Failed to restore ad'));
      } finally {
        setBusyId(null);
      }
    },
    [load, page],
  );

  const remove = useCallback(
    async (id: string): Promise<{ message: string }> => {
      setBusyId(id);
      try {
        await ProductApi.deleteProduct(id);
        await load(page, 'silent');
        return { message: 'Ad deleted permanently' };
      } catch (err) {
        throw new Error(getErrorMessage(err, 'Failed to delete ad'));
      } finally {
        setBusyId(null);
      }
    },
    [load, page],
  );

  return useMemo(
    () => ({
      items,
      total,
      loading,
      refreshing,
      loadingMore,
      error,
      hasMore,
      search,
      setSearch,
      sort,
      setSort,
      busyId,
      refresh,
      loadMore,
      restore,
      remove,
      reload: () => load(1, 'replace'),
    }),
    [
      busyId,
      error,
      hasMore,
      items,
      load,
      loading,
      loadingMore,
      refresh,
      loadMore,
      remove,
      restore,
      refreshing,
      search,
      sort,
      total,
    ],
  );
};
