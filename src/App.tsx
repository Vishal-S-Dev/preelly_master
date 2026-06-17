import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './presentation/navigation/AppNavigator';
import { store } from './presentation/redux/store';
import { ErrorBoundary } from './presentation/components/common/ErrorBoundary';
import { OfflineToast } from './presentation/components/common/OfflineToast';
import { NetworkManager } from './data/network/NetworkManager';
import { loadStoredSession } from './presentation/redux/slices/authSlice';
import { setOnboardingCompleted } from './presentation/redux/slices/appSlice';
import { STORAGE_KEYS } from './constants/appConstants';
import { storage } from './utils/storage';
import { SplashScreen } from './presentation/screens/SplashScreen';
import { setThemeMode } from './presentation/redux/slices/themeSlice';
import { CallProvider } from './presentation/call/CallContext';
import { ShareSheetProvider } from './presentation/context/ShareSheetContext';
import { ensureSocketReadyForUser } from './data/network/chatSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

const Bootstrap: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const onboarding = await storage.getString(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const persistedTheme = await storage.getString(STORAGE_KEYS.THEME_MODE);
      if (persistedTheme === 'dark' || persistedTheme === 'light') {
        store.dispatch(setThemeMode(persistedTheme));
      }
      store.dispatch(setOnboardingCompleted(onboarding === 'true'));
      await store.dispatch(loadStoredSession());
      const { auth } = store.getState();
      if (auth.isAuthenticated && !auth.isGuest && auth.user?.id) {
        await ensureSocketReadyForUser(auth.user.id);
      }
      setReady(true);
    };
    init().catch(() => setReady(true));

    const unsubscribe = store.subscribe(() => {
      const mode = store.getState().theme.mode;
      storage.setString(STORAGE_KEYS.THEME_MODE, mode).catch(() => undefined);
    });
    return unsubscribe;
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <CallProvider>
      <NetworkManager />
      <AppNavigator />
      <OfflineToast />
    </CallProvider>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <BottomSheetModalProvider>
            <ShareSheetProvider>
              <Bootstrap />
            </ShareSheetProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
