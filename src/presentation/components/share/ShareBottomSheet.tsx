import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SharePayload, ShareRecipient, SocialSharePlatform } from '../../../types/share.types';
import { ShareSheetState } from '../../hooks/useShareSheetState';
import { ShareSearchBar } from './ShareSearchBar';
import { ShareSendActions } from './ShareSendActions';
import { ShareUserGridItem } from './ShareUserGridItem';
import { SocialShareFooter } from './SocialShareFooter';
import { shareSheetStyles, SHARE_UI } from './shareSheetStyles';

interface Props {
  payload: SharePayload | null;
  onDismiss?: () => void;
  onOpenSearch: () => void;
  state: ShareSheetState;
}

const GRID_COLUMNS = 3;
const SNAP_POINTS = ['72%', '92%'];

export const ShareBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ payload, onDismiss, onOpenSearch, state }, ref) => {
    const {
      isAuthenticated,
      gridPeople,
      loading,
      error,
      retry,
      query,
      setQuery,
      selectedMap,
      selectedUsers,
      selectedCount,
      toggleUser,
      message,
      setMessage,
      sending,
      handleInternalSend,
      handlePlatform: handlePlatformRaw,
    } = state;

    const isReelShare = payload?.contentType === 'reel';
    const hasPeople = gridPeople.length > 0;
    const listData = loading && !hasPeople ? [] : gridPeople;

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index < 0) {
          onDismiss?.();
        }
      },
      [onDismiss],
    );

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

    const dismissSheet = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const showSuccess = useCallback(
      (text: string) => {
        Alert.alert('Sent', text, [{ text: 'OK', onPress: dismissSheet }]);
      },
      [dismissSheet],
    );

    const onSendIndividual = useCallback(async () => {
      const result = await handleInternalSend('individual');
      if (!result) {
        return;
      }
      if (result.successCount === 0) {
        Alert.alert('Could not send', 'Please try again.');
      } else if (result.failedCount > 0) {
        Alert.alert(
          'Partially sent',
          `Sent to ${result.successCount} user(s). ${result.failedCount} failed.`,
        );
      } else if (result.successCount > 1) {
        showSuccess(`Shared individually with ${result.successCount} people.`);
      } else {
        showSuccess(`Shared with ${selectedUsers[0]?.name ?? 'user'}.`);
      }
    }, [handleInternalSend, selectedUsers, showSuccess]);

    const onSendGroup = useCallback(async () => {
      const result = await handleInternalSend('group');
      if (!result) {
        return;
      }
      if (result.successCount === 0) {
        Alert.alert('Could not send', 'Please try again.');
      } else if (result.failedCount > 0) {
        Alert.alert(
          'Partially sent',
          `Sent to ${result.successCount} user(s). ${result.failedCount} failed.`,
        );
      } else if (result.successCount > 1) {
        showSuccess(`Shared with ${result.successCount} people as a group message.`);
      } else {
        showSuccess(`Shared with ${selectedUsers[0]?.name ?? 'user'}.`);
      }
    }, [handleInternalSend, selectedUsers, showSuccess]);

    const handlePlatform = useCallback(
      async (platform: SocialSharePlatform) => {
        try {
          await handlePlatformRaw(platform);
          if (platform === 'copy') {
            Alert.alert('Copied', 'Link copied to clipboard.');
          }
        } catch {
          Alert.alert('Share failed', 'Unable to open share option.');
        }
      },
      [handlePlatformRaw],
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={Platform.OS === 'ios' ? 8 : 0}>
          <View style={footerStyles.wrap}>
            {selectedCount > 0 ? (
              <>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write a message..."
                  placeholderTextColor={SHARE_UI.textMuted}
                  style={footerStyles.messageInput}
                  multiline
                  maxLength={500}
                />
                {isReelShare ? (
                  <SocialShareFooter onPlatformPress={handlePlatform} compact />
                ) : null}
                <View style={footerStyles.sendWrap}>
                  <ShareSendActions
                    selectedUsers={selectedUsers}
                    sending={sending}
                    onSendIndividual={onSendIndividual}
                    onSendGroup={onSendGroup}
                  />
                </View>
              </>
            ) : (
              <SocialShareFooter onPlatformPress={handlePlatform} compact={isReelShare} />
            )}
          </View>
        </BottomSheetFooter>
      ),
      [
        handlePlatform,
        isReelShare,
        message,
        onSendGroup,
        onSendIndividual,
        selectedCount,
        selectedUsers,
        sending,
        setMessage,
      ],
    );

    const listHeader = useMemo(
      () => (
        <View>
          <View style={shareSheetStyles.handleWrap}>
            <View style={shareSheetStyles.handle} />
          </View>
          <Text style={shareSheetStyles.headerTitle}>Share</Text>
          <ShareSearchBar
            value={query}
            onChangeText={setQuery}
            onPress={onOpenSearch}
            onAddUser={onOpenSearch}
          />
        </View>
      ),
      [onOpenSearch, query, setQuery],
    );

    const listEmpty = useMemo(() => {
      if (!isAuthenticated) {
        return (
          <View style={shareSheetStyles.emptyWrap}>
            <Icon name="account-lock-outline" size={40} color={SHARE_UI.textMuted} />
            <Text style={shareSheetStyles.emptyTitle}>Sign in to share</Text>
            <Text style={shareSheetStyles.emptyBody}>
              Log in to send {isReelShare ? 'reels' : 'listings'} to your followers.
            </Text>
          </View>
        );
      }
      if (loading) {
        return (
          <View style={shareSheetStyles.emptyWrap}>
            <ActivityIndicator color={SHARE_UI.primary} size="large" />
            <Text style={shareSheetStyles.emptyLoadingText}>Loading people…</Text>
          </View>
        );
      }
      if (error) {
        return (
          <View style={shareSheetStyles.emptyWrap}>
            <Text style={shareSheetStyles.emptyTitle}>Could not load followers</Text>
            <Text style={shareSheetStyles.emptyBody}>{error}</Text>
            <Pressable style={shareSheetStyles.retryBtn} onPress={retry}>
              <Text style={shareSheetStyles.retryText}>Retry</Text>
            </Pressable>
          </View>
        );
      }
      return (
        <View style={shareSheetStyles.emptyWrap}>
          <Icon name="account-group-outline" size={40} color={SHARE_UI.textMuted} />
          <Text style={shareSheetStyles.emptyTitle}>No followers yet</Text>
          <Text style={shareSheetStyles.emptyBody}>
            When people follow you, they will appear here.
          </Text>
        </View>
      );
    }, [error, isAuthenticated, isReelShare, loading, retry]);

    const renderItem = useCallback(
      ({ item }: { item: ShareRecipient }) => (
        <ShareUserGridItem
          user={item}
          selected={Boolean(selectedMap[item.id])}
          onToggle={toggleUser}
        />
      ),
      [selectedMap, toggleUser],
    );

    const keyExtractor = useCallback((item: ShareRecipient) => item.id, []);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        enableDynamicSizing={false}
        // See ShareUserSearchSheet for why: gorhom's default stackBehavior would auto-minimize
        // this sheet the instant a sibling modal presents on top of it.
        stackBehavior="push"
        backdropComponent={renderBackdrop}
        backgroundStyle={shareSheetStyles.sheetBackground}
        handleComponent={null}
        footerComponent={renderFooter}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={handleSheetChange}>
        <BottomSheetFlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={GRID_COLUMNS}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={[
            shareSheetStyles.listContent,
            !hasPeople && shareSheetStyles.listContentEmpty,
          ]}
          columnWrapperStyle={hasPeople ? shareSheetStyles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={15}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </BottomSheetModal>
    );
  },
);

ShareBottomSheet.displayName = 'ShareBottomSheet';

const footerStyles = StyleSheet.create({
  wrap: {
    backgroundColor: SHARE_UI.sheetBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SHARE_UI.border,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  messageInput: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    minHeight: 44,
    maxHeight: 88,
    fontSize: 16,
    color: SHARE_UI.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHARE_UI.border,
    paddingVertical: 10,
  },
  sendWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
});
