import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChatMessage, ChatParticipant, ChatThread } from '../../../domain/models/ChatThread';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { ChatMessageRichContent } from '../../components/chat/ChatMessageRichContent';
import { useCall } from '../../call/CallContext';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  addOptimisticMessage,
  clearActiveThread,
  fetchChatThread,
  removeOptimisticMessage,
  sendChatMessage,
} from '../../redux/slices/chatSlice';
import {
  getChatSocket,
  joinChatRoom,
  leaveChatRoom,
  normalizeSocketUserId,
} from '../../../data/network/chatSocket';
import { ChatMessageDTO } from '../../../data/dto/ChatDTO';
import { RootStackParamList } from '../../navigation/types';
import { QUICK_REPLIES, THREAD_UI } from './chatThreadStyles';
import {
  formatCallDuration,
  formatMessageTime,
  groupMessages,
  MessageGroup,
} from './chatThreadUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

const PLACEHOLDER_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128`;

function otherPartyFromThread(thread: ChatThread, _viewerId: string): ChatParticipant | null {
  if (!thread) {
    return null;
  }
  if (thread.kind === 'support') {
    return { id: 'support', name: 'Support', avatarUrl: '', isVerified: true };
  }
  return thread.viewerRole === 'buyer' ? thread.seller : thread.buyer;
}

const CallBubble: React.FC<{ message: ChatMessage; isSelf: boolean }> = ({ message, isSelf }) => {
  const meta = message.callMeta;
  const isVideo = meta?.callType === 'video';
  const missed =
    meta?.status === 'missed' || meta?.status === 'rejected' || meta?.status === 'cancelled';
  const label =
    meta?.status === 'completed'
      ? `${isVideo ? 'Video' : 'Voice'} call${formatCallDuration(meta.duration ?? 0) ? ` · ${formatCallDuration(meta.duration ?? 0)}` : ''}`
      : meta?.status === 'missed'
        ? `Missed ${isVideo ? 'video' : 'voice'} call`
        : meta?.status === 'rejected'
          ? `Declined ${isVideo ? 'video' : 'voice'} call`
          : `${isVideo ? 'Video' : 'Voice'} call`;

  return (
    <View
      style={[
        styles.callBubble,
        isSelf ? styles.bubbleOutgoing : styles.bubbleIncoming,
      ]}
    >
      <Feather
        name={isVideo ? 'video' : 'phone'}
        size={18}
        color={missed ? '#EF4444' : '#16A34A'}
      />
      <Text style={[styles.callBubbleText, missed && styles.callMissed]}>
        {label}
      </Text>
    </View>
  );
};

const MessageBubble: React.FC<{
  message: ChatMessage;
  isSelf: boolean;
  otherAvatar: string;
  otherName: string;
  selfAvatar: string;
  selfName: string;
}> = ({ message, isSelf, otherAvatar, selfAvatar }) => {
  if (message.type === 'call') {
    return (
      <View style={[styles.msgRow, isSelf ? styles.msgRowSelf : styles.msgRowOther]}>
        {!isSelf ? (
          <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} />
        ) : null}
        <CallBubble message={message} isSelf={isSelf} />
        {isSelf ? <Image source={{ uri: selfAvatar }} style={styles.msgAvatar} /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.msgRow, isSelf ? styles.msgRowSelf : styles.msgRowOther]}>
      {!isSelf ? <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} /> : null}
      <View style={[styles.bubble, isSelf ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
        <ChatMessageRichContent text={message.text} variant={isSelf ? 'outgoing' : 'incoming'} />
      </View>
      {isSelf ? <Image source={{ uri: selfAvatar }} style={styles.msgAvatar} /> : null}
    </View>
  );
};

export const ChatThreadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { threadId } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { startCall } = useCall();
  const user = useAppSelector(s => s.auth.user);
  const thread = useAppSelector(s => s.chat.activeThread);
  const messages = useAppSelector(s => s.chat.activeMessages);
  const threadLoading = useAppSelector(s => s.chat.threadLoading);
  const threadError = useAppSelector(s => s.chat.threadError);
  const sending = useAppSelector(s => s.chat.sendingMessage);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<MessageGroup>>(null);

  useEffect(() => {
    dispatch(fetchChatThread(threadId));
    joinChatRoom(threadId);

    let unsub: (() => void) | undefined;
    getChatSocket().then(socket => {
      const onNewMessage = (data: { chatId?: string; message?: ChatMessageDTO }) => {
        if (data.chatId !== threadId || !data.message) {
          return;
        }
        dispatch(fetchChatThread(threadId));
      };
      socket.on('new-message', onNewMessage);
      unsub = () => socket.off('new-message', onNewMessage);
    });

    return () => {
      unsub?.();
      leaveChatRoom(threadId);
      dispatch(clearActiveThread());
    };
  }, [dispatch, threadId]);

  const other = useMemo(
    () => (user?.id && thread ? otherPartyFromThread(thread, user.id) : null),
    [thread, user?.id],
  );

  const grouped = useMemo(() => groupMessages(messages), [messages]);

  const otherAvatar = other?.avatarUrl || PLACEHOLDER_AVATAR(other?.name ?? 'User');
  const selfAvatar = user?.avatar
    ? resolveMediaUrl(user.avatar)
    : PLACEHOLDER_AVATAR(user?.name ?? 'You');

  const handleSend = useCallback(
    async (msgText?: string) => {
      const trimmed = (msgText ?? text).trim();
      if (!trimmed || !user?.id) {
        return;
      }
      setText('');
      const tempId = `temp-${Date.now()}`;
      dispatch(
        addOptimisticMessage({
          id: tempId,
          senderId: user.id,
          senderRole: thread?.viewerRole === 'buyer' || thread?.viewerRole === 'seller' ? thread.viewerRole : null,
          type: 'text',
          text: trimmed,
          createdAt: new Date().toISOString(),
          read: false,
          readAt: null,
        }),
      );
      try {
        await dispatch(sendChatMessage({ threadId, text: trimmed })).unwrap();
      } catch {
        dispatch(removeOptimisticMessage(tempId));
        setText(trimmed);
      }
    },
    [dispatch, text, thread, threadId, user?.id],
  );

  const listHeader = useMemo(() => {
    if (!thread?.productImageUrl || thread.kind !== 'product') {
      return null;
    }
    return (
      <View style={[styles.msgRow, styles.msgRowOther]}>
        <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} />
        <View style={styles.listingBubble}>
          <Image source={{ uri: thread.productImageUrl }} style={styles.listingImage} />
          <View style={styles.listingOverlayTop}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {thread.productTitle}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [thread, otherAvatar]);

  const renderGroup = useCallback(
    ({ item }: { item: MessageGroup }) => (
      <View>
        <Text style={styles.dayDivider}>{item.label}</Text>
        {item.messages.map(m => {
          const isSelf = m.senderId === user?.id;
          return (
            <View key={m.id} style={styles.msgBlock}>
              <MessageBubble
                message={m}
                isSelf={isSelf}
                otherAvatar={otherAvatar}
                otherName={other?.name ?? 'User'}
                selfAvatar={selfAvatar}
                selfName={user?.name ?? 'You'}
              />
              <Text style={styles.msgTime}>{formatMessageTime(m.createdAt)}</Text>
            </View>
          );
        })}
      </View>
    ),
    [user?.id, otherAvatar, selfAvatar, other?.name, user?.name],
  );

  useEffect(() => {
    if (grouped.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [grouped.length, messages.length]);

  if (threadLoading && !thread) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={THREAD_UI.primary} />
      </View>
    );
  }

  if (threadError && !thread) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{threadError}</Text>
        <Pressable onPress={() => dispatch(fetchChatThread(threadId))}>
          <Text style={styles.retryLink}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <Feather name="arrow-left" size={24} color={THREAD_UI.primary} />
        </Pressable>
        <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerName} numberOfLines={1}>
              {other?.name ?? 'User'}
            </Text>
            {other?.isVerified ? (
              <Feather
                name="check-decagram"
                size={16}
                color={THREAD_UI.verifiedBlue}
              />
            ) : null}
          </View>
          <View style={styles.activeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.activeText}>Active Now</Text>
          </View>
        </View>
        <Pressable
          hitSlop={12}
          style={styles.headerBtn}
          onPress={() =>
            other?.id &&
            startCall(
              { id: normalizeSocketUserId(other.id), name: other.name },
              'audio',
              threadId,
            )
          }
        >
          <Feather name="phone" size={22} color={THREAD_UI.primary} />
        </Pressable>
        <Pressable
          hitSlop={12}
          style={styles.headerBtn}
          onPress={() =>
            other?.id &&
            startCall(
              { id: normalizeSocketUserId(other.id), name: other.name },
              'video',
              threadId,
            )
          }
        >
          <Feather name="video" size={22} color={THREAD_UI.primary} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={grouped}
        keyExtractor={g => g.label}
        renderItem={renderGroup}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !threadLoading ? (
            <Text style={styles.emptyChat}>No messages yet — say hello!</Text>
          ) : null
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickRepliesScroll}
        contentContainerStyle={styles.quickRepliesContent}
      >
        {QUICK_REPLIES.map(qr => (
          <Pressable
            key={qr}
            style={styles.quickChip}
            onPress={() => handleSend(qr)}
          >
            <Text style={styles.quickChipText}>{qr}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={THREAD_UI.textMuted}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable style={styles.inputIcon} hitSlop={8}>
            <Feather name="image-outline" size={22} color={THREAD_UI.primary} />
          </Pressable>
          <Pressable style={styles.inputIcon} hitSlop={8}>
            <Feather
              name="microphone-outline"
              size={22}
              color={THREAD_UI.primary}
            />
          </Pressable>
        </View>
        {(text.trim().length > 0 || sending) && (
          <Pressable
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THREAD_UI.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: THREAD_UI.textSecondary,
    marginBottom: 8,
  },
  retryLink: {
    color: THREAD_UI.primary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THREAD_UI.headerBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: THREAD_UI.incomingBubble,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: THREAD_UI.primary,
    maxWidth: 160,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THREAD_UI.onlineGreen,
  },
  activeText: {
    fontSize: 12,
    color: THREAD_UI.textMuted,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyChat: {
    textAlign: 'center',
    color: THREAD_UI.textMuted,
    marginTop: 40,
    fontSize: 14,
  },
  dayDivider: {
    textAlign: 'center',
    fontSize: 12,
    color: THREAD_UI.timestamp,
    marginVertical: 16,
  },
  msgBlock: {
    marginBottom: 14,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '82%',
  },
  msgRowSelf: {
    alignSelf: 'flex-end',
  },
  msgRowOther: {
    alignSelf: 'flex-start',
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THREAD_UI.incomingBubble,
  },
  bubble: {
    flexShrink: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  bubbleIncoming: {
    backgroundColor: THREAD_UI.incomingBubble,
  },
  bubbleOutgoing: {
    backgroundColor: THREAD_UI.outgoingBubble,
  },
  callBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  callBubbleText: {
    fontSize: 14,
    color: THREAD_UI.incomingText,
    fontWeight: '500',
  },
  callMissed: {
    color: '#EF4444',
  },
  msgTime: {
    fontSize: 11,
    color: THREAD_UI.timestamp,
    marginTop: 6,
    textAlign: 'center',
    alignSelf: 'center',
  },
  listingBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 220,
    height: 200,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  listingTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  quickRepliesScroll: {
    maxHeight: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THREAD_UI.divider,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THREAD_UI.chipBorder,
    backgroundColor: THREAD_UI.background,
    marginRight: 8,
    height : 38,
  },
  quickChipText: {
    fontSize: 13,
    color: THREAD_UI.incomingText,

  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THREAD_UI.divider,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THREAD_UI.inputBorder,
    borderRadius: 24,
    paddingHorizontal: 12,
    minHeight: 46,
    backgroundColor: THREAD_UI.background,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: THREAD_UI.incomingText,
    maxHeight: 100,
    paddingVertical: 10,
  },
  inputIcon: {
    padding: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THREAD_UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
