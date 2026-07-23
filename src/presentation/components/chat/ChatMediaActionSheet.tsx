import React, { forwardRef, useCallback, useMemo } from 'react';
import { BottomSheetBackdrop, BottomSheetModal, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';

interface Props {
  busy?: boolean;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
}

export const ChatMediaActionSheet = forwardRef<BottomSheetModal, Props>(
  ({ busy = false, onTakePhoto, onChooseGallery }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['34%'], []);

    const closeSheet = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
        backdropComponent={renderBackdrop}
      >
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.title}>Send photo</Text>
          <Pressable
            style={styles.action}
            disabled={busy}
            onPress={() => {
              closeSheet();
              onTakePhoto();
            }}
          >
            <Icon name="camera-outline" size={22} color={THREAD_UI.primary} />
            <Text style={styles.actionText}>Take Photo</Text>
          </Pressable>
          <Pressable
            style={styles.action}
            disabled={busy}
            onPress={() => {
              closeSheet();
              onChooseGallery();
            }}
          >
            <Icon name="image-multiple-outline" size={22} color={THREAD_UI.primary} />
            <Text style={styles.actionText}>Choose From Gallery</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.cancelAction]} onPress={closeSheet}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    );
  },
);

ChatMediaActionSheet.displayName = 'ChatMediaActionSheet';

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#CBD5E1',
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: THREAD_UI.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cancelAction: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: THREAD_UI.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
});
