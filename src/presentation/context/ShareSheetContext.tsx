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
import { useShareSheetState } from '../hooks/useShareSheetState';
import { ShareBottomSheet } from '../components/share/ShareBottomSheet';
import { ShareUserSearchSheet } from '../components/share/ShareUserSearchSheet';

interface ShareSheetContextValue {
  openShare: (payload: SharePayload) => void;
  closeShare: () => void;
}

const ShareSheetContext = createContext<ShareSheetContextValue | null>(null);

export const ShareSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const searchSheetRef = useRef<BottomSheetModal>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  const state = useShareSheetState(payload);
  const { setQuery, resetForClose } = state;

  const openShare = useCallback((next: SharePayload) => {
    setPayload(next);
    requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
  }, []);

  const closeShare = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const onDismissShare = useCallback(() => {
    setPayload(null);
    resetForClose();
  }, [resetForClose]);

  // Two independent, sibling BottomSheetModals — the search sheet is never nested inside the
  // main sheet's component tree, which avoids gorhom's known multi-modal quirk where presenting
  // one BottomSheetModal fires a spurious onChange(-1) on another that's already open.
  const openSearchSheet = useCallback(() => {
    searchSheetRef.current?.present();
  }, []);

  const closeSearchSheet = useCallback(() => {
    searchSheetRef.current?.dismiss();
    setQuery('');
  }, [setQuery]);

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
        onDismiss={onDismissShare}
        onOpenSearch={openSearchSheet}
        state={state}
      />
      <ShareUserSearchSheet ref={searchSheetRef} state={state} onDone={closeSearchSheet} />
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
