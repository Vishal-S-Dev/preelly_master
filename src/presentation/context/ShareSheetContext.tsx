import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SharePayload } from '../../types/share.types';
import { ShareBottomSheet } from '../components/share/ShareBottomSheet';

interface ShareSheetContextValue {
  openShare: (payload: SharePayload) => void;
  closeShare: () => void;
}

const ShareSheetContext = createContext<ShareSheetContextValue | null>(null);

export const ShareSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  const openShare = useCallback((next: SharePayload) => {
    setPayload(next);
    requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
  }, []);

  const closeShare = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const value = useMemo(
    () => ({ openShare, closeShare }),
    [openShare, closeShare],
  );

  return (
    <ShareSheetContext.Provider value={value}>
      {children}
      <ShareBottomSheet
        ref={sheetRef}
        payload={payload}
        onDismiss={() => setPayload(null)}
      />
    </ShareSheetContext.Provider>
  );
};

export const useShareSheet = (): ShareSheetContextValue => {
  const ctx = useContext(ShareSheetContext);
  if (!ctx) {
    throw new Error('useShareSheet must be used within ShareSheetProvider');
  }
  return ctx;
};
