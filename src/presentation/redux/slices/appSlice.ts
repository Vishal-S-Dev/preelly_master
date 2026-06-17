import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  hasCompletedOnboarding: boolean;
  isOnline: boolean;
}

const initialState: AppState = {
  hasCompletedOnboarding: false,
  isOnline: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnboardingCompleted(state, action: PayloadAction<boolean>) {
      state.hasCompletedOnboarding = action.payload;
    },
    setNetworkStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
  },
});

export const { setOnboardingCompleted, setNetworkStatus } = appSlice.actions;
export default appSlice.reducer;
