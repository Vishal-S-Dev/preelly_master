import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ShareRecipient } from '../../../types/share.types';
import { ShareSheetState } from '../../hooks/useShareSheetState';
import { ShareUserSearchRow } from './ShareUserSearchRow';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  state: ShareSheetState;
  onDone: () => void;
}

const SNAP_POINTS = ['92%'];

/**
 * Instagram-style dedicated search screen. This is a SIBLING of ShareBottomSheet (both mounted
 * by ShareSheetContext), not nested inside it — two independent BottomSheetModals rather than
 * one presented from within the other, which avoids gorhom's known multi-modal quirk where
 * presenting one modal fires a spurious onChange(-1) on another. Selections live in the same
 * shared `selectedMap` (owned by useShareSheetState) as the main sheet, so they're already
 * reflected there the instant you tap a row — closing this sheet ("Done"/"Cancel") is purely a
 * navigation step, not a commit step.
 */
export const ShareUserSearchSheet = forwardRef<BottomSheetModal, Props>(
  ({ state, onDone }, ref) => {
    const {
      query,
      setQuery,
      searchPeople: people,
      isSearching,
      loading,
      searching,
      error,
      searchError,
      selectedMap,
      toggleUser,
    } = state;

    const inputRef = useRef<TextInput>(null);
    const selectedCount = Object.keys(selectedMap).length;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="none"
        />
      ),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: ShareRecipient }) => (
        <ShareUserSearchRow
          user={item}
          selected={Boolean(selectedMap[item.id])}
          onToggle={toggleUser}
        />
      ),
      [selectedMap, toggleUser],
    );

    const keyExtractor = useCallback((item: ShareRecipient) => item.id, []);

    const listEmpty = useMemo(() => {
      if (loading || (isSearching && searching)) {
        return (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={SHARE_UI.primary} />
          </View>
        );
      }
      const message = isSearching
        ? searchError ?? error ?? 'No results'
        : error ?? 'No followers yet';
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{message}</Text>
        </View>
      );
    }, [error, isSearching, loading, searchError, searching]);

    const onSheetChange = useCallback((index: number) => {
      if (index >= 0) {
        // Sheet just became visible — focus the input a beat after the open animation starts
        // so the keyboard slides in with it, matching Instagram's search screen.
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, []);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        enableDynamicSizing={false}
        // gorhom's default stackBehavior ('switch') auto-minimizes whatever BottomSheetModal is
        // already presented when a new one opens — which would visually minimize ShareBottomSheet
        // the instant this search sheet appears. 'push' presents this on top without touching it.
        stackBehavior="push"
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={null}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={onSheetChange}>
        <View style={styles.header}>
          <View style={styles.searchWrap}>
            <Icon name="magnify" size={20} color={SHARE_UI.textMuted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={SHARE_UI.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search users"
            />
          </View>
          <Pressable onPress={onDone} hitSlop={8} accessibilityRole="button">
            <Text style={styles.actionText}>{selectedCount > 0 ? 'Done' : 'Cancel'}</Text>
          </Pressable>
        </View>

        <BottomSheetFlatList
          data={people}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={people.length === 0 ? styles.listContentEmpty : styles.listContent}
          initialNumToRender={18}
          maxToRenderPerBatch={14}
          windowSize={9}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </BottomSheetModal>
    );
  },
);

ShareUserSearchSheet.displayName = 'ShareUserSearchSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: SHARE_UI.sheetBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.4%'),
    paddingBottom: hp('1.2%'),
    gap: wp('2.5%'),
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    height: hp('5.2%'),
    gap: wp('2%'),
  },
  input: {
    flex: 1,
    fontSize: wp('4%'),
    color: SHARE_UI.text,
    paddingVertical: 0,
  },
  actionText: {
    fontSize: wp('3.9%'),
    fontWeight: '700',
    color: SHARE_UI.primary,
  },
  listContent: {
    paddingBottom: hp('3%'),
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('6%'),
  },
  emptyText: {
    fontSize: wp('3.6%'),
    color: SHARE_UI.textMuted,
  },
});
