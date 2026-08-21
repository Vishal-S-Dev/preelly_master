import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PAGINATION } from '../../../constants/appConstants';
import { ProductApi } from '../../../data/api/ProductApi';
import { FeedApi, FeedType } from '../../../data/api/feedApi';
import { FeedReelDto, QuickViewFieldDto } from '../../../data/dto/FeedDTO';
import { ProductRepositoryImpl } from '../../../data/repository/ProductRepositoryImpl';
import { Product } from '../../../domain/models/Product';
import { LikeProductUseCase, SaveProductUseCase } from '../../../domain/usecases/productUseCases';
import {
  recordProductViewSilently,
} from '../../../services/productView.service';

const productRepo = new ProductRepositoryImpl();
const likeProductUseCase = new LikeProductUseCase(productRepo);
const saveProductUseCase = new SaveProductUseCase(productRepo);

const mapQuickViewField = (field: QuickViewFieldDto) => ({
  fieldKey: field.fieldKey ?? '',
  fieldTitle: field.fieldTitle ?? '',
  fieldValue: field.fieldValue ?? '',
});

const mapFeedReelToProduct = (item: FeedReelDto): Product => {
  const id = item._id ?? item.id ?? `feed_${Date.now()}`;
  const images = (item.images ?? []).map(path => ProductApi.withBase(path));
  const firstImage = images[0] ?? '';
  const videoUrl = item.video ? ProductApi.withBase(item.video) : '';
  const sellerAvatar = item.seller?.avatar
    ? ProductApi.withBase(item.seller.avatar)
    : undefined;
  const mileage = item.mileage ?? item.kilometers;

  return {
    id,
    title: item.title ?? 'Untitled Product',
    description: item.description ?? item.caption ?? '',
    price: item.price ?? 0,
    currency: item.currency ?? 'AED',
    videoUrl,
    imageUrl: firstImage,
    images: images.length > 0 ? images : undefined,
    location: item.location ?? 'Unknown',
    likesCount: item.likesCount ?? 0,
    views: item.views ?? 0,
    commentCount: item.commentCount ?? 0,
    isSaved: Boolean(item.saved),
    createdAt: item.createdAt ?? new Date().toISOString(),
    year: item.year,
    mileage,
    regionalSpecs: item.regionalSpecs,
    quickViewData: (item.quickViewData ?? [])
      .map(mapQuickViewField)
      .filter(field => field.fieldTitle && field.fieldValue),
    user: item.seller?.name
      ? {
          name: item.seller.name,
          avatar: sellerAvatar,
        }
      : undefined,
    seller: item.seller?._id
      ? {
          id: item.seller._id,
          name: item.seller.name,
          avatar: sellerAvatar,
          isVerified: item.seller.isVerified,
        }
      : undefined,
    contactOptions: item.contactOptions
      ? {
          inAppChat: Boolean(item.contactOptions.inAppChat),
          call: Boolean(item.contactOptions.call),
          whatsapp: Boolean(item.contactOptions.whatsapp),
        }
      : undefined,
    contactName: item.contactName ?? item.seller?.name,
    contactPhone: item.contactPhone,
    isViewed: Boolean(item.isViewed ?? item.viewed),
    isSold: Boolean(item.isSold),
    liked: Boolean(item.liked),
    saved: Boolean(item.saved),
    isPaused: false,
  };
};

interface FeedState {
  products: Product[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  activeIndex: number;
}

const createInitialFeedState = (): FeedState => ({
  products: [],
  page: PAGINATION.INITIAL_PAGE,
  hasMore: true,
  loading: false,
  refreshing: false,
  activeIndex: 0,
});

interface ProductState {
  /**
   * Both feeds are kept independently (rather than a single swapped-out list) so switching
   * between "Trending" and "Following" is instant — the destination feed is already loaded,
   * matching the Instagram-style swipe UX where both pages preview real content while dragging.
   */
  feeds: Record<FeedType, FeedState>;
}

const initialState: ProductState = {
  feeds: {
    trending: createInitialFeedState(),
    following: createInitialFeedState(),
  },
};

/** Applies `updater` to a product wherever it appears, across every feed — the same underlying
 * product can be present in both Trending and Following simultaneously. */
const updateProductInAllFeeds = (
  state: ProductState,
  productId: string,
  updater: (product: Product) => Product,
) => {
  (Object.keys(state.feeds) as FeedType[]).forEach(feedType => {
    const feed = state.feeds[feedType];
    feed.products = feed.products.map(product =>
      product.id === productId ? updater(product) : product,
    );
  });
};

export const fetchProductsFromFeed = createAsyncThunk(
  'product/fetchProductsFromFeed',
  async (
    {
      page,
      refresh = false,
      feedType = 'trending',
    }: { page: number; refresh?: boolean; feedType?: FeedType },
  ) => {
    const response = await FeedApi.getFeed(page, PAGINATION.LIMIT, feedType);
    return {
      payload: {
        feedType,
        page: response.reelsMeta?.page ?? page,
        hasMore: Boolean(response.reelsMeta?.hasMore),
        products: response.reels.map(mapFeedReelToProduct),
      },
      refresh,
    };
  },
);


export const likeProduct = createAsyncThunk(
  'product/likeProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await likeProductUseCase.execute(productId);
      return { productId, ...response };
    } catch (error: any) {
      return rejectWithValue({
        productId,
        message: error?.response?.data?.message ?? 'Failed to update like',
      });
    }
  },
);

export const saveProduct = createAsyncThunk(
  'product/saveProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await saveProductUseCase.execute(productId);
      return { productId, ...response };
    } catch (error: any) {
      return rejectWithValue({
        productId,
        message: error?.response?.data?.message ?? 'Failed to update save',
      });
    }
  },
);

/**
 * Fire-and-forget product view after ≥70% watch. Never surfaces errors to UI.
 */
export const markProductViewed = createAsyncThunk(
  'product/markProductViewed',
  async (
    { productId, isViewed }: { productId: string; isViewed?: boolean },
    { getState },
  ) => {
    const auth = (getState() as { auth?: { isAuthenticated?: boolean; isGuest?: boolean } })
      .auth;
    if (!auth?.isAuthenticated || auth.isGuest) {
      return { productId, recorded: false };
    }

    const recorded = await recordProductViewSilently(productId, { isViewed });
    return { productId, recorded };
  },
);

const applyOptimisticLikeToggle = (state: ProductState, productId: string) => {
  updateProductInAllFeeds(state, productId, product => ({
    ...product,
    liked: !product.liked,
    likesCount: product.liked
      ? Math.max(0, product.likesCount - 1)
      : product.likesCount + 1,
  }));
};

const applyOptimisticSaveToggle = (state: ProductState, productId: string) => {
  updateProductInAllFeeds(state, productId, product => ({
    ...product,
    isSaved: !product.isSaved,
  }));
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setActiveIndex(state, action: PayloadAction<{ feedType: FeedType; index: number }>) {
      state.feeds[action.payload.feedType].activeIndex = action.payload.index;
    },
    togglePause(state, action: PayloadAction<{ feedType: FeedType; productId: string }>) {
      const feed = state.feeds[action.payload.feedType];
      feed.products = feed.products.map(product =>
        product.id === action.payload.productId
          ? { ...product, isPaused: !product.isPaused }
          : product,
      );
    },
    toggleLike(state, action: PayloadAction<string>) {
      applyOptimisticLikeToggle(state, action.payload);
    },
    toggleSave(state, action: PayloadAction<string>) {
      applyOptimisticSaveToggle(state, action.payload);
    },
    markProductAsViewedLocal(state, action: PayloadAction<string>) {
      updateProductInAllFeeds(state, action.payload, product => ({
        ...product,
        isViewed: true,
        views: product.isViewed ? product.views : product.views + 1,
      }));
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProductsFromFeed.pending, (state, action) => {
        const feed = state.feeds[action.meta.arg.feedType ?? 'trending'];
        feed.loading = !action.meta.arg.refresh;
        feed.refreshing = Boolean(action.meta.arg.refresh);
      })
      .addCase(fetchProductsFromFeed.fulfilled, (state, action) => {
        const { payload, refresh } = action.payload;
        const feed = state.feeds[payload.feedType];
        feed.loading = false;
        feed.refreshing = false;
        feed.page = payload.page;
        feed.hasMore = payload.hasMore;
        feed.products = refresh
          ? payload.products
          : [...feed.products, ...payload.products];
        if (refresh) {
          feed.activeIndex = 0;
        }
      })
      .addCase(fetchProductsFromFeed.rejected, (state, action) => {
        const feed = state.feeds[action.meta.arg.feedType ?? 'trending'];
        feed.loading = false;
        feed.refreshing = false;
      })
      .addCase(likeProduct.pending, (state, action) => {
        applyOptimisticLikeToggle(state, action.meta.arg);
      })
      .addCase(likeProduct.fulfilled, (state, action) => {
        updateProductInAllFeeds(state, action.payload.productId, product => ({
          ...product,
          liked: action.payload.liked,
          likesCount: Math.max(0, action.payload.likeCount),
        }));
      })
      .addCase(likeProduct.rejected, (state, action) => {
        const productId =
          (action.payload as { productId?: string } | undefined)?.productId ??
          action.meta.arg;
        if (productId) {
          applyOptimisticLikeToggle(state, productId);
        }
      })
      .addCase(saveProduct.pending, (state, action) => {
        applyOptimisticSaveToggle(state, action.meta.arg);
      })
      .addCase(saveProduct.fulfilled, (state, action) => {
        updateProductInAllFeeds(state, action.payload.productId, product => ({
          ...product,
          isSaved: Boolean(action.payload.saved),
        }));
      })
      .addCase(saveProduct.rejected, (state, action) => {
        const productId =
          (action.payload as { productId?: string } | undefined)?.productId ??
          action.meta.arg;
        if (productId) {
          applyOptimisticSaveToggle(state, productId);
        }
      })
      .addCase(markProductViewed.fulfilled, (state, action) => {
        if (!action.payload.recorded) {
          return;
        }
        updateProductInAllFeeds(state, action.payload.productId, product => ({
          ...product,
          isViewed: true,
          views: product.isViewed ? product.views : product.views + 1,
        }));
      });
  },
});

export const {
  setActiveIndex,
  togglePause,
  toggleLike,
  toggleSave,
  markProductAsViewedLocal,
} = productSlice.actions;
export default productSlice.reducer;
