import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PAGINATION } from '../../../constants/appConstants';
import { FeedRepositoryImpl } from '../../../data/repository/FeedRepositoryImpl';
import { FeedItem } from '../../../domain/models/FeedItem';
import { GetFeedUseCase } from '../../../domain/usecases/GetFeedUseCase';

const getFeedUseCase = new GetFeedUseCase(new FeedRepositoryImpl());

interface FeedState {
  items: FeedItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  activeIndex: number;
}

const initialState: FeedState = {
  items: [],
  page: PAGINATION.INITIAL_PAGE,
  hasMore: true,
  loading: false,
  refreshing: false,
  activeIndex: 0,
};

export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async ({ page, refresh = false }: { page: number; refresh?: boolean }) => {
    const payload = await getFeedUseCase.execute(page, PAGINATION.LIMIT);
    return { payload, refresh };
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    toggleLike(state, action: PayloadAction<string>) {
      state.items = state.items.map(item =>
        item.id === action.payload
          ? {
              ...item,
              isLiked: !item.liked,
              likes: item.liked ? item.likes - 1 : item.likes + 1,
            }
          : item,
      );
    },
    setActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload;
    },
    togglePause(state, action: PayloadAction<string>) {
      state.items = state.items.map(item =>
        item.id === action.payload ? { ...item, isPaused: !item.isPaused } : item,
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.loading = !action.meta.arg.refresh;
        state.refreshing = Boolean(action.meta.arg.refresh);
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { payload, refresh } = action.payload;
        state.loading = false;
        state.refreshing = false;
        state.page = payload.page;
        state.hasMore = payload.hasMore;
        state.items = refresh ? payload.items : [...state.items, ...payload.items];
      })
      .addCase(fetchFeed.rejected, state => {
        state.loading = false;
        state.refreshing = false;
      });
  },
});

export const { toggleLike, setActiveIndex, togglePause } = feedSlice.actions;
export default feedSlice.reducer;
