import { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '../../domain/models/Product';
import { profileService } from '../../services/profile.service';
import { UserFeedListingSource } from '../../navigation/types';

const PAGE_SIZE = 18;

interface UseUserFeedDataOptions {
  userId: string;
  initialProductId: string;
  initialIndex: number;
  seedProducts?: Product[];
  listingSource?: UserFeedListingSource;
}

const resolveInitialIndex = (
  products: Product[],
  initialProductId: string,
  initialIndex: number,
): number => {
  const byId = products.findIndex(item => item.id === initialProductId);
  if (byId >= 0) {
    return byId;
  }
  if (initialIndex >= 0 && initialIndex < products.length) {
    return initialIndex;
  }
  return 0;
};

export const useUserFeedData = ({
  userId,
  initialProductId,
  initialIndex,
  seedProducts,
  listingSource = 'posts',
}: UseUserFeedDataOptions) => {
  const [products, setProducts] = useState<Product[]>(seedProducts ?? []);
  const [page, setPage] = useState(() =>
    seedProducts?.length ? Math.max(1, Math.ceil(seedProducts.length / PAGE_SIZE)) : 0,
  );
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(!seedProducts?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    seedProducts?.length
      ? resolveInitialIndex(seedProducts, initialProductId, initialIndex)
      : Math.max(0, initialIndex),
  );

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let result;
        if (listingSource === 'saved') {
          result = await profileService.getSavedProducts(nextPage, PAGE_SIZE);
        } else if (listingSource === 'liked') {
          result = await profileService.getLikedProducts(nextPage, PAGE_SIZE);
        } else {
          result = await profileService.getUserListings(userId, nextPage, PAGE_SIZE);
        }

        setProducts(prev => (replace ? result.products : [...prev, ...result.products]));
        setPage(nextPage);
        setHasMore(result.hasMore);
        setError(null);

        if (replace) {
          setActiveIndex(resolveInitialIndex(result.products, initialProductId, initialIndex));
        }
      } catch {
        setError('Could not load reels');
        if (replace) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [initialIndex, initialProductId, listingSource, userId],
  );

  useEffect(() => {
    if (!seedProducts?.length) {
      fetchPage(1, true);
    }
  }, [fetchPage, seedProducts?.length]);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    fetchPage(page + 1, false);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  const togglePause = useCallback((productId: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, isPaused: !product.isPaused }
          : product,
      ),
    );
  }, []);

  const applyLikeResult = useCallback(
    (productId: string, liked: boolean, likeCount: number) => {
      setProducts(prev =>
        prev.map(product =>
          product.id === productId ? { ...product, liked, likesCount: likeCount } : product,
        ),
      );
    },
    [],
  );

  const applySaveResult = useCallback((productId: string, saved: boolean) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId ? { ...product, isSaved: saved, saved } : product,
      ),
    );
  }, []);

  const initialScrollIndex = useMemo(
    () => resolveInitialIndex(products, initialProductId, initialIndex),
    [initialIndex, initialProductId, products],
  );

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    activeIndex,
    setActiveIndex,
    initialScrollIndex,
    onLoadMore,
    togglePause,
    applyLikeResult,
    applySaveResult,
  };
};
