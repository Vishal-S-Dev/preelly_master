import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import presenceReducer from './slices/presenceSlice';
import feedReducer from './slices/feedSlice';
import productReducer from './slices/productSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    chat: chatReducer,
    presence: presenceReducer,
    feed: feedReducer,
    product: productReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
