import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PAGINATION } from '../../../constants/appConstants';
import { ProductApi } from '../../../data/api/ProductApi';
import { FeedApi, FeedType } from '../../../data/api/feedApi';
import { FeedReelDto, QuickViewFieldDto } from '../../../data/dto/FeedDTO';
import { ProductRepositoryImpl } from '../../../data/repository/ProductRepositoryImpl';
import { Product } from '../../../domain/models/Product';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';
import { LikeProductUseCase, SaveProductUseCase } from '../../../domain/usecases/productUseCases';
import {
  recordProductViewSilently,
} from '../../../services/productView.service';

const productRepo = new ProductRepositoryImpl();
const getProductsUseCase = new GetProductsUseCase(productRepo);
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

interface ProductState {
  products: Product[];
  page: number;
  hasMore: boolean;
  feedType: FeedType;
  loading: boolean;
  refreshing: boolean;
  activeIndex: number;
}

const initialState: ProductState = {
  products: [],
  page: PAGINATION.INITIAL_PAGE,
  hasMore: true,
  feedType: 'trending',
  loading: false,
  refreshing: false,
  activeIndex: 0,
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async ({ page, refresh = false }: { page: number; refresh?: boolean }) => {
    const payload = await getProductsUseCase.execute(page, PAGINATION.LIMIT);
    return { payload, refresh };
  },
);

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
  state.products = state.products.map(product =>
    product.id === productId
      ? {
          ...product,
          liked: !product.liked,
          likesCount: product.liked
            ? Math.max(0, product.likesCount - 1)
            : product.likesCount + 1,
        }
      : product,
  );
};

const applyOptimisticSaveToggle = (state: ProductState, productId: string) => {
  state.products = state.products.map(product =>
    product.id === productId
      ? { ...product, isSaved: !product.isSaved }
      : product,
  );
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload;
    },
    togglePause(state, action: PayloadAction<string>) {
      state.products = state.products.map(product =>
        product.id === action.payload
          ? { ...product, isPaused: !product.isPaused }
          : product,
      );
    },
    toggleLike(state, action: PayloadAction<string>) {
      applyOptimisticLikeToggle(state, action.payload);
    },
    toggleSave(state, action: PayloadAction<string>) {
      state.products = state.products.map(product =>
        product.id === action.payload
          ? { ...product, isSaved: !product.isSaved }
          : product,
      );
    },
    markProductAsViewedLocal(state, action: PayloadAction<string>) {
      state.products = state.products.map(product =>
        product.id === action.payload
          ? {
              ...product,
              isViewed: true,
              views: product.isViewed ? product.views : product.views + 1,
            }
          : product,
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        state.loading = !action.meta.arg.refresh;
        state.refreshing = Boolean(action.meta.arg.refresh);
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { payload, refresh } = action.payload;
        state.loading = false;
        state.refreshing = false;
        state.page = payload.page;
        state.hasMore = payload.hasMore;
        state.products = refresh
          ? payload.products
          : [...state.products, ...payload.products];
      })
      .addCase(fetchProducts.rejected, state => {
        state.loading = false;
        state.refreshing = false;
      })
      .addCase(fetchProductsFromFeed.pending, (state, action) => {
        state.loading = !action.meta.arg.refresh;
        state.refreshing = Boolean(action.meta.arg.refresh);
      })
      .addCase(fetchProductsFromFeed.fulfilled, (state, action) => {
        const { payload, refresh } = action.payload;
        state.loading = false;
        state.refreshing = false;
        state.feedType = payload.feedType;
        state.page = payload.page;
        state.hasMore = payload.hasMore;
        state.products = refresh
          ? payload.products
          : [...state.products, ...payload.products];
      })
      .addCase(fetchProductsFromFeed.rejected, state => {
        state.loading = false;
        state.refreshing = false;
      })
      .addCase(likeProduct.pending, (state, action) => {
        applyOptimisticLikeToggle(state, action.meta.arg);
      })
      .addCase(likeProduct.fulfilled, (state, action) => {
        state.products = state.products.map(product =>
          product.id === action.payload.productId
            ? {
                ...product,
                liked: action.payload.liked,
                likesCount: Math.max(0, action.payload.likeCount),
              }
            : product,
        );
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
        state.products = state.products.map(product =>
          product.id === action.payload.productId
            ? { ...product, isSaved: Boolean(action.payload.saved) }
            : product,
        );
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
        state.products = state.products.map(product =>
          product.id === action.payload.productId
            ? {
                ...product,
                isViewed: true,
                views: product.isViewed ? product.views : product.views + 1,
              }
            : product,
        );
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
