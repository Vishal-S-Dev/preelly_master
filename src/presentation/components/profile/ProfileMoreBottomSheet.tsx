import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCENT = '#0000FF';
const DIVIDER = '#E8E8E8';
const TEXT = '#111827';

export interface ProfileMoreMenuState {
  isBlocked: boolean;
  isMuted: boolean;
  busy?: boolean;
}

interface Props {
  state: ProfileMoreMenuState;
  onBlock: () => void;
  onReport: () => void;
  onMute: () => void;
}

type ActionItem = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
};

export const ProfileMoreBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ state, onBlock, onReport, onMute }, ref) => {
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
          opacity={0.4}
          pressBehavior="close"
        />
      ),
      [],
    );

    const actions: ActionItem[] = useMemo(
      () => [
        {
          key: 'block',
          label: state.isBlocked ? 'Unblock' : 'Block',
          icon: 'cancel',
          onPress: onBlock,
        },
        {
          key: 'report',
          label: 'Report',
          icon: 'alert-rhombus-outline',
          onPress: onReport,
        },
        {
          key: 'mute',
          label: state.isMuted ? 'Unmute Notifications' : 'Mute Notifications',
          icon: state.isMuted ? 'bell-outline' : 'bell-off-outline',
          onPress: onMute,
        },
      ],
      [onBlock, onMute, onReport, state.isBlocked, state.isMuted],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!state.busy}
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
        backdropComponent={renderBackdrop}
      >
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>More</Text>
            <Pressable
              onPress={closeSheet}
              hitSlop={10}
              disabled={state.busy}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeBtn}
            >
              <Icon name="close" size={22} color={TEXT} />
            </Pressable>
          </View>

          {actions.map((action, index) => (
            <Pressable
              key={action.key}
              style={[styles.row, index < actions.length - 1 ? styles.rowBorder : null]}
              disabled={state.busy}
              onPress={() => {
                closeSheet();
                // Defer so the sheet can dismiss before alerts/modals present.
                setTimeout(() => action.onPress(), 180);
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Icon name={action.icon} size={22} color={ACCENT} />
              <Text style={styles.rowLabel}>{action.label}</Text>
              {state.busy ? <ActivityIndicator size="small" color={ACCENT} /> : null}
            </Pressable>
          ))}
        </View>
      </BottomSheetModal>
    );
  },
);

ProfileMoreBottomSheet.displayName = 'ProfileMoreBottomSheet';

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
  },
});
