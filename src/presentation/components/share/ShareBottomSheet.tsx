import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { shareService } from '../../../services/share.service';
import { shareViaPlatform, copyShareLink } from '../../../utils/shareSocial';
import { useShareFollowers } from '../../hooks/useShareFollowers';
import { useAppSelector } from '../../hooks/useRedux';
import { ShareSearchBar } from './ShareSearchBar';
import { ShareUserGridItem } from './ShareUserGridItem';
import { SelectedUsersList } from './SelectedUsersList';
import { SocialShareFooter } from './SocialShareFooter';
import { shareSheetStyles, SHARE_UI } from './shareSheetStyles';

interface Props {
  payload: SharePayload | null;
  onDismiss?: () => void;
}

const GRID_COLUMNS = 3;

export const ShareBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ payload, onDismiss }, ref) => {
    const snapPoints = useMemo(() => ['72%', '92%'], []);
    const userId = useAppSelector(s => s.auth.user?.id ?? null);
    const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated && !s.auth.isGuest);

    const [visible, setVisible] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Record<string, ShareRecipient>>({});
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const {
      followers,
      loading,
      error,
      query,
      setQuery,
      retry,
    } = useShareFollowers(userId, visible && isAuthenticated);

    const selectedUsers = useMemo(() => Object.values(selectedMap), [selectedMap]);
    const selectedCount = selectedUsers.length;

    useEffect(() => {
      if (!payload) {
        setSelectedMap({});
        setMessage('');
        setQuery('');
      }
    }, [payload, setQuery]);

    const handleSheetChange = useCallback(
      (index: number) => {
        setVisible(index >= 0);
        if (index < 0) {
          setSelectedMap({});
          setMessage('');
          setQuery('');
          onDismiss?.();
        }
      },
      [onDismiss, setQuery],
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

    const toggleUser = useCallback((user: ShareRecipient) => {
      setSelectedMap(prev => {
        const next = { ...prev };
        if (next[user.id]) {
          delete next[user.id];
        } else {
          next[user.id] = user;
        }
        return next;
      });
    }, []);

    const removeUser = useCallback((id: string) => {
      setSelectedMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, []);

    const dismissSheet = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const showSuccess = useCallback((text: string) => {
      Alert.alert('Sent', text, [{ text: 'OK', onPress: dismissSheet }]);
    }, [dismissSheet]);

    const handleInternalSend = useCallback(
      async (mode: 'individual' | 'group') => {
        if (!payload || !selectedCount) {
          return;
        }
        setSending(true);
        try {
          const result = await shareService.sendToRecipients(
            payload,
            selectedUsers,
            message,
            mode,
          );
          if (result.successCount === 0) {
            Alert.alert('Could not send', 'Please try again.');
            return;
          }
          if (result.failedCount > 0) {
            Alert.alert(
              'Partially sent',
              `Sent to ${result.successCount} user(s). ${result.failedCount} failed.`,
            );
          } else {
            showSuccess(
              mode === 'group' && selectedCount > 1
                ? `Shared with ${result.successCount} people.`
                : `Shared with ${selectedUsers[0]?.name ?? 'user'}.`,
            );
          }
        } catch {
          Alert.alert('Send failed', 'Unable to share right now.');
        } finally {
          setSending(false);
        }
      },
      [message, payload, selectedCount, selectedUsers, showSuccess],
    );

    const handlePlatform = useCallback(
      async (platform: SocialSharePlatform) => {
        if (!payload) {
          return;
        }
        try {
          if (platform === 'copy') {
            await copyShareLink(payload);
            Alert.alert('Copied', 'Link copied to clipboard.');
            return;
          }
          await shareViaPlatform(platform, payload);
        } catch {
          Alert.alert('Share failed', 'Unable to open share option.');
        }
      },
      [payload],
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={Platform.OS === 'ios' ? 8 : 0}>
          <View style={footerStyles.wrap}>
            {selectedCount > 0 ? (
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write a message..."
                placeholderTextColor={SHARE_UI.textMuted}
                style={footerStyles.messageInput}
                multiline
                maxLength={500}
              />
            ) : null}
            <SocialShareFooter onPlatformPress={handlePlatform} />
            {selectedCount > 0 ? (
              <View style={footerStyles.sendRow}>
                {selectedCount > 1 ? (
                  <Pressable
                    style={[footerStyles.sendBtn, footerStyles.sendBtnSecondary]}
                    disabled={sending}
                    onPress={() => handleInternalSend('individual')}>
                    <Text style={footerStyles.sendBtnSecondaryText}>Send individual</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[
                    footerStyles.sendBtn,
                    footerStyles.sendBtnPrimary,
                    selectedCount === 1 && { flex: 1 },
                    sending && footerStyles.sendBtnDisabled,
                  ]}
                  disabled={sending}
                  onPress={() =>
                    handleInternalSend(selectedCount > 1 ? 'group' : 'individual')
                  }>
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={footerStyles.sendBtnPrimaryText}>
                      {selectedCount > 1 ? `Send Group (${selectedCount})` : 'Send'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </BottomSheetFooter>
      ),
      [
        handleInternalSend,
        handlePlatform,
        message,
        selectedCount,
        sending,
      ],
    );

    const listHeader = useMemo(
      () => (
        <View>
          <View style={shareSheetStyles.handleWrap}>
            <View style={shareSheetStyles.handle} />
          </View>
          <Text style={shareSheetStyles.headerTitle}>Share</Text>
          <ShareSearchBar value={query} onChangeText={setQuery} />
          <SelectedUsersList users={selectedUsers} onRemove={removeUser} />
        </View>
      ),
      [query, removeUser, selectedUsers, setQuery],
    );

    const listEmpty = useMemo(() => {
      if (!isAuthenticated) {
        return (
          <View style={shareSheetStyles.emptyWrap}>
            <Icon name="account-lock-outline" size={40} color={SHARE_UI.textMuted} />
            <Text style={shareSheetStyles.emptyTitle}>Sign in to share</Text>
            <Text style={shareSheetStyles.emptyBody}>
              Log in to send listings to your followers.
            </Text>
          </View>
        );
      }
      if (loading) {
        return (
          <View style={shareSheetStyles.emptyWrap}>
            <ActivityIndicator color={SHARE_UI.primary} size="large" />
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
          <Text style={shareSheetStyles.emptyTitle}>
            {query ? 'No results' : 'No followers yet'}
          </Text>
          <Text style={shareSheetStyles.emptyBody}>
            {query
              ? 'Try a different name or username.'
              : 'When people follow you, they will appear here.'}
          </Text>
        </View>
      );
    }, [error, isAuthenticated, loading, query, retry]);

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
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={shareSheetStyles.sheetBackground}
        handleComponent={null}
        footerComponent={renderFooter}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={handleSheetChange}>
        <BottomSheetFlatList
          data={followers}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={GRID_COLUMNS}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={shareSheetStyles.listContent}
          columnWrapperStyle={shareSheetStyles.gridRow}
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
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  messageInput: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    minHeight: 40,
    maxHeight: 80,
    fontSize: 15,
    color: SHARE_UI.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHARE_UI.border,
    paddingVertical: 8,
  },
  sendRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sendBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  sendBtnPrimary: {
    backgroundColor: SHARE_UI.primary,
  },
  sendBtnSecondary: {
    backgroundColor: SHARE_UI.primaryLight,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sendBtnSecondaryText: {
    color: SHARE_UI.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
