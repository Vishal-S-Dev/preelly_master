import React, { forwardRef, useCallback, useMemo } from 'react';
import { BottomSheetBackdrop, BottomSheetModal, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  hasAvatar: boolean;
  busy?: boolean;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
  onRemovePhoto: () => void;
}

export const ProfilePhotoActionSheet = forwardRef<BottomSheetModal, Props>(
  ({ hasAvatar, busy = false, onTakePhoto, onChooseGallery, onRemovePhoto }, ref) => {
    const { styles, colors } = useProfileStyles();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => [hasAvatar ? '42%' : '34%'], [hasAvatar]);

    const closeSheet = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const onPressTakePhoto = useCallback(() => {
      closeSheet();
      onTakePhoto();
    }, [closeSheet, onTakePhoto]);

    const onPressGallery = useCallback(() => {
      closeSheet();
      onChooseGallery();
    }, [closeSheet, onChooseGallery]);

    const onPressRemove = useCallback(() => {
      closeSheet();
      onRemovePhoto();
    }, [closeSheet, onRemovePhoto]);

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
        handleIndicatorStyle={{ backgroundColor: colors.muted }}
        backgroundStyle={styles.photoSheetBg}
        backdropComponent={renderBackdrop}>
        <View style={[styles.photoSheetContent, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <Pressable
            style={styles.photoSheetAction}
            onPress={onPressTakePhoto}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Take photo">
            <Icon name="camera-outline" size={22} color={colors.text} />
            <Text style={styles.photoSheetActionText}>Take Photo</Text>
          </Pressable>
          <Pressable
            style={styles.photoSheetAction}
            onPress={onPressGallery}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery">
            <Icon name="image-outline" size={22} color={colors.text} />
            <Text style={styles.photoSheetActionText}>Choose From Gallery</Text>
          </Pressable>
          {hasAvatar ? (
            <Pressable
              style={styles.photoSheetAction}
              onPress={onPressRemove}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Remove profile photo">
              <Icon name="trash-can-outline" size={22} color={colors.danger} />
              <Text style={[styles.photoSheetActionText, { color: colors.danger }]}>
                Remove Photo
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.photoSheetAction, styles.photoSheetCancel]}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.photoSheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    );
  },
);

ProfilePhotoActionSheet.displayName = 'ProfilePhotoActionSheet';
