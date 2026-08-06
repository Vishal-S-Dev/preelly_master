import React, { forwardRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlockSearchResultListing } from '../../../types/blockedUsers.types';
import { BLOCKED_COLORS, blockedUsersStyles } from '../../screens/blocked/blockedUsersStyles';

interface Props {
  user: BlockSearchResultListing | null;
  busy?: boolean;
  onConfirm: () => void;
  onDismiss?: () => void;
}

const BULLETS: Array<{ icon: string; text: string }> = [
  {
    icon: 'cancel',
    text: 'They wont be able to message you or find your profile or ads on Preelly anymore.',
  },
  {
    icon: 'bell-off-outline',
    text: 'They wont be notified that you blocked them.',
  },
  {
    icon: 'check-circle-outline',
    text: 'You can unblock them anytime for settings.',
  },
];

export const BlockConfirmSheet = forwardRef<BottomSheetModal, Props>(
  ({ user, busy, onConfirm, onDismiss }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['62%'], []);

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
          pressBehavior={busy ? 'none' : 'close'}
        />
      ),
      [busy],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!busy}
        enableDynamicSizing={false}
        onDismiss={onDismiss}
        handleIndicatorStyle={blockedUsersStyles.sheetHandle}
        backgroundStyle={blockedUsersStyles.sheetBg}
        backdropComponent={renderBackdrop}>
        <View style={[blockedUsersStyles.sheetContent, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={blockedUsersStyles.sheetHeaderRow}>
            <Text style={blockedUsersStyles.sheetTitle}>Block this account?</Text>
            <Pressable
              onPress={closeSheet}
              hitSlop={10}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Icon name="close" size={22} color={BLOCKED_COLORS.text} />
            </Pressable>
          </View>

          {user ? (
            <View style={blockedUsersStyles.sheetTargetWrap}>
              {user.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={blockedUsersStyles.sheetAvatar} />
              ) : (
                <View
                  style={[
                    blockedUsersStyles.sheetAvatar,
                    { alignItems: 'center', justifyContent: 'center' },
                  ]}>
                  <Icon name="account" size={32} color={BLOCKED_COLORS.faint} />
                </View>
              )}
              <Text style={blockedUsersStyles.sheetTargetName}>{user.name}</Text>
              <Text style={blockedUsersStyles.sheetTargetRole}>{user.roleLabel}</Text>
            </View>
          ) : null}

          <Text style={blockedUsersStyles.sheetWarning}>
            This will also block any other profile they have or create in future.
          </Text>

          {BULLETS.map(bullet => (
            <View key={bullet.icon} style={blockedUsersStyles.sheetBulletRow}>
              <Icon name={bullet.icon} size={22} color={BLOCKED_COLORS.muted} />
              <Text style={blockedUsersStyles.sheetBulletText}>{bullet.text}</Text>
            </View>
          ))}

          <View style={blockedUsersStyles.sheetButtonsRow}>
            <Pressable
              style={blockedUsersStyles.sheetButton}
              onPress={closeSheet}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Cancel">
              <Text style={blockedUsersStyles.sheetButtonText}>No</Text>
            </Pressable>
            <Pressable
              style={blockedUsersStyles.sheetButton}
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Confirm block">
              {busy ? (
                <ActivityIndicator size="small" color={BLOCKED_COLORS.primary} />
              ) : (
                <Text style={blockedUsersStyles.sheetButtonText}>Yes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

BlockConfirmSheet.displayName = 'BlockConfirmSheet';
