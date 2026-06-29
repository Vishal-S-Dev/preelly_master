import React, { forwardRef, useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../../domain/models/Product';

export type OwnerListingMenuAction =
  | 'edit'
  | 'warehouse'
  | 'insight'
  | 'boost'
  | 'sold'
  | 'unpublish'
  | 'delete';

interface MenuItem {
  key: OwnerListingMenuAction;
  label: string;
  icon: string;
  destructive?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'edit', label: 'Edit this Ad', icon: 'pencil-outline' },
  { key: 'warehouse', label: 'Move to Warehouse', icon: 'home-outline' },
  { key: 'insight', label: 'See Insight', icon: 'chart-bar' },
  { key: 'boost', label: 'Boost this Ad', icon: 'rocket-launch-outline' },
  { key: 'sold', label: 'Mark as sold', icon: 'gavel' },
  { key: 'unpublish', label: 'Unpublish this', icon: 'eye-off-outline' },
  { key: 'delete', label: 'Delete this Ad', icon: 'trash-can-outline', destructive: true },
];

interface Props {
  product: Product | null;
  onDismiss?: () => void;
  onAction?: (action: OwnerListingMenuAction, product: Product) => void;
}

export const OwnerListingMenuSheet = forwardRef<BottomSheetModal, Props>(
  ({ product, onDismiss, onAction }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['52%'], []);

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

    const handlePress = useCallback(
      (item: MenuItem) => {
        if (!product) {
          return;
        }

        closeSheet();

        if (onAction) {
          onAction(item.key, product);
          return;
        }

        if (item.destructive) {
          Alert.alert(
            item.label,
            'Are you sure you want to delete this listing? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => undefined,
              },
            ],
          );
          return;
        }

        Alert.alert(item.label, 'This action will be available in a future update.');
      },
      [closeSheet, onAction, product],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        onDismiss={onDismiss}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
        backdropComponent={renderBackdrop}>
        <View style={[styles.content, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>More</Text>
            <Pressable
              onPress={closeSheet}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close menu">
              <Icon name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          {MENU_ITEMS.map((item, index) => (
            <View key={item.key}>
              <Pressable
                style={styles.menuRow}
                onPress={() => handlePress(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}>
                <Icon
                  name={item.icon}
                  size={22}
                  color={item.destructive ? '#EF4444' : '#2563EB'}
                />
                <Text style={[styles.menuLabel, item.destructive && styles.menuLabelDestructive]}>
                  {item.label}
                </Text>
              </Pressable>
              {index < MENU_ITEMS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </BottomSheetModal>
    );
  },
);

OwnerListingMenuSheet.displayName = 'OwnerListingMenuSheet';

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  menuLabelDestructive: {
    color: '#EF4444',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
});
