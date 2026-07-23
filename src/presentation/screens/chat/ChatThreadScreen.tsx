import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChatMessage, ChatParticipant, ChatThread } from '../../../domain/models/ChatThread';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { ChatMessageRichContent } from '../../components/chat/ChatMessageRichContent';
import { ChatAttachmentPreviewBar } from '../../components/chat/ChatAttachmentPreviewBar';
import { ChatImageAttachmentsGrid } from '../../components/chat/ChatImageAttachmentsGrid';
import { ChatMediaActionSheet } from '../../components/chat/ChatMediaActionSheet';
import { useChatImagePicker } from '../../hooks/useChatImagePicker';
import {
  isImageAttachment,
  MAX_CHAT_ATTACHMENTS,
  pendingToOptimisticAttachments,
  pendingToOutgoingFile,
  PendingChatAttachment,
  resolveAttachmentUrl,
  resolveMessageAttachments,
} from '../../../utils/chatAttachmentUtils';
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
import { QUICK_REPLIES, REEL_DM_QUICK_REPLIES, THREAD_UI } from './chatThreadStyles';
import {
  formatCallDuration,
  formatMessageTime,
  groupMessages,
  MessageGroup,
} from './chatThreadUtils';
import { ProductApi } from '../../../data/api/ProductApi';
import { ProductDTO } from '../../../data/dto/ProductDTO';
import { CartApi } from '../../../data/api/CartApi';
import { MakeOfferSheet, OfferResponseSheet, ProductOfferPreview } from '../../components/chat/OfferBottomSheet';
import { formatPostedDate } from '../../../utils/cartCheckoutUtils';
import { isReelShareThread, messageUsesReelLink, resolveListingOwnerId } from '../../../utils/reelShareUtils';

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
  onPressAttachment?: (images: string[], index: number) => void;
}> = ({ message, isSelf, otherAvatar, selfAvatar, onPressAttachment }) => {
  const attachments = useMemo(
    () => resolveMessageAttachments(message.attachments, message.attachment),
    [message.attachment, message.attachments],
  );
  const imageAttachments = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments],
  );

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

  if (imageAttachments.length > 0) {
    return (
      <View style={[styles.msgRow, isSelf ? styles.msgRowSelf : styles.msgRowOther]}>
        {!isSelf ? <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} /> : null}
        <ChatImageAttachmentsGrid
          attachments={imageAttachments}
          caption={message.text?.trim() || undefined}
          isSelf={isSelf}
          dimmed={message.id.startsWith('temp-')}
          onPressImage={index =>
            onPressAttachment?.(
              imageAttachments.map(item => resolveAttachmentUrl(item.url)),
              index,
            )
          }
        />
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

const OFFER_RE = /^💰\s*Offer:\s*AED\s*([\d,.]+)\b/i;
const OFFER_ACCEPTED_RE = /^✅\s*Offer accepted(?:\s+for\s+AED\s*([\d,.]+))?/i;

function parseOfferAccepted(text?: string | null): { amount: number | null } | null {
  const trimmed = String(text ?? '').trim();
  if (!OFFER_ACCEPTED_RE.test(trimmed)) {
    return null;
  }
  const match = /AED\s*([\d,.]+)/i.exec(trimmed);
  if (!match) {
    return { amount: null };
  }
  const value = Number(String(match[1]).replace(/,/g, ''));
  return { amount: Number.isFinite(value) && value > 0 ? value : null };
}

function parseOfferAmount(text?: string | null): { raw: string; value: number } | null {
  const match = OFFER_RE.exec(String(text ?? '').trim());
  if (!match) {
    return null;
  }
  const raw = match[1];
  const value = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return { raw, value };
}

const OfferMessageBubble: React.FC<{
  offerAmount: number;
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
  onRespond?: () => void;
}> = ({ offerAmount, isSelf, otherAvatar, selfAvatar, onRespond }) => {
  const amountLabel = offerAmount.toLocaleString('en-US');

  if (isSelf) {
    return (
      <View style={[styles.msgRow, styles.msgRowSelf]}>
        <View style={[styles.bubble, styles.bubbleOutgoing]}>
          <Text style={styles.finalOfferText}>Final Offer {amountLabel}</Text>
        </View>
        <Image source={{ uri: selfAvatar }} style={styles.msgAvatar} />
      </View>
    );
  }

  return (
    <View style={[styles.msgRow, styles.msgRowOther]}>
      <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} />
      <Pressable onPress={onRespond} style={{ flex: 1 }}>
        <View style={[styles.offerCard, styles.offerCardIncoming]}>
          <Text style={styles.offerTitle}>Offer for your ad</Text>
          <Text style={styles.offerAmount}>AED {amountLabel}</Text>
          <Text style={styles.offerHint}>Tap to respond</Text>
        </View>
      </Pressable>
    </View>
  );
};

const DealAcceptedBubble: React.FC<{
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
}> = ({ isSelf, otherAvatar, selfAvatar }) => (
  <View style={[styles.msgRow, isSelf ? styles.msgRowSelf : styles.msgRowOther]}>
    {!isSelf ? <Image source={{ uri: otherAvatar }} style={styles.msgAvatar} /> : null}
    <View style={styles.dealAcceptedBubble}>
      <Feather name="thumb-up" size={16} color="#FFF" />
      <Text style={styles.dealAcceptedText}>Deal Accepted</Text>
    </View>
    {isSelf ? <Image source={{ uri: selfAvatar }} style={styles.msgAvatar} /> : null}
  </View>
);

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
  const [pendingAttachments, setPendingAttachments] = useState<PendingChatAttachment[]>([]);
  const listRef = useRef<FlatList<MessageGroup>>(null);
  const mediaSheetRef = useRef<BottomSheetModal>(null);
  const { pickFromCamera, pickFromGallery } = useChatImagePicker();

  const openedOfferMessageIdsRef = useRef<Set<string>>(new Set());
  const openedAcceptedOfferMessageIdsRef = useRef<Set<string>>(new Set());

  // Buyer cart badge (used on chat thread header).
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  // Offer sheets
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);
  const [offerResponseOpen, setOfferResponseOpen] = useState(false);
  const [activeOfferAmount, setActiveOfferAmount] = useState<number>(0);

  // Max offer validation (derived from the listing price).
  const [maxOfferAmount, setMaxOfferAmount] = useState<number | null>(null);
  const [, setMaxOfferLoading] = useState(false);
  const [listingProduct, setListingProduct] = useState<ProductDTO | null>(null);

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

  const listingOwnerId = useMemo(
    () => resolveListingOwnerId(listingProduct),
    [listingProduct],
  );

  const isReelShareDm = useMemo(() => {
    if (!thread || thread.kind !== 'product') {
      return false;
    }
    if (isReelShareThread(thread.seller.id, listingOwnerId)) {
      return true;
    }
    return messages.some(
      m => m.type !== 'call' && messageUsesReelLink(m.text, thread.productId),
    );
  }, [listingOwnerId, messages, thread]);

  const isBuyer = Boolean(
    thread &&
      thread.kind === 'product' &&
      thread.viewerRole === 'buyer' &&
      thread.productId &&
      !isReelShareDm,
  );

  const quickReplies = isReelShareDm ? REEL_DM_QUICK_REPLIES : QUICK_REPLIES;

  const showMessageComposer = useMemo(() => {
    if (thread?.kind === 'support' || !thread?.productId) {
      return true;
    }
    return !Boolean(listingProduct?.isSold);
  }, [listingProduct?.isSold, thread?.kind, thread?.productId]);

  const refreshCartCount = useCallback(async () => {
    if (!isBuyer || !thread?.productId || isReelShareDm) {
      setCartCount(0);
      return;
    }
    setCartLoading(true);
    try {
      const items = await CartApi.getCart();
      const targetProductId = String(thread.productId);
      const count = items
        .filter(it => String(CartApi.resolveProductId(it.productId)) === targetProductId)
        .reduce((sum, it) => sum + (it.quantity && it.quantity > 0 ? it.quantity : 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    } finally {
      setCartLoading(false);
    }
  }, [isBuyer, isReelShareDm, thread?.productId]);

  const startCheckoutPayment = useCallback(() => {
    if (!thread?.productId) {
      Alert.alert('Cart is empty', 'Accept an offer to add this listing to your cart.');
      return;
    }
    navigation.navigate('CartCheckout', { productId: thread.productId });
  }, [navigation, thread?.productId]);

  const resolveMaxOffer = useCallback(async (): Promise<number | null> => {
    if (!thread?.productId) {
      setMaxOfferAmount(null);
      return null;
    }
    setMaxOfferLoading(true);
    try {
      const product = await ProductApi.getProductById(thread.productId);
      const max =
        typeof product.productPriceValue === 'number' && Number.isFinite(product.productPriceValue)
          ? product.productPriceValue
          : typeof product.price === 'number' && Number.isFinite(product.price)
            ? product.price
            : 0;
      const normalized = max > 0 ? max : null;
      setMaxOfferAmount(normalized);
      return normalized;
    } finally {
      setMaxOfferLoading(false);
    }
  }, [thread?.productId]);

  useEffect(() => {
    if (thread?.productId) {
      void resolveMaxOffer();
    }
  }, [resolveMaxOffer, thread?.productId]);

  useEffect(() => {
    if (!thread?.productId) {
      setListingProduct(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const product = await ProductApi.getProductById(thread.productId!);
        if (!cancelled) {
          setListingProduct(product);
        }
      } catch {
        if (!cancelled) {
          setListingProduct(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [thread?.productId]);

  useEffect(() => {
    void refreshCartCount();
  }, [refreshCartCount]);

  const listingPriceLabel = useMemo(() => {
    const price =
      typeof listingProduct?.productPriceValue === 'number'
        ? listingProduct.productPriceValue
        : typeof listingProduct?.price === 'number'
          ? listingProduct.price
          : maxOfferAmount;
    if (typeof price !== 'number' || price <= 0) {
      return null;
    }
    return price.toLocaleString('en-US');
  }, [listingProduct?.price, listingProduct?.productPriceValue, maxOfferAmount]);

  const offerProductPreview = useMemo<ProductOfferPreview | null>(() => {
    if (!thread?.productTitle && !thread?.productImageUrl) {
      return null;
    }
    const originalPrice =
      typeof listingProduct?.productPriceValue === 'number'
        ? listingProduct.productPriceValue
        : typeof listingProduct?.price === 'number'
          ? listingProduct.price
          : maxOfferAmount;
    return {
      imageUrl: thread?.productImageUrl ?? null,
      title: thread?.productTitle ?? listingProduct?.title ?? null,
      categoryLabel:
        listingProduct?.condition ||
        (typeof listingProduct?.category === 'object'
          ? listingProduct.category?.name
          : listingProduct?.category) ||
        null,
      year: listingProduct?.year ?? null,
      kilometers: listingProduct?.kilometers ?? listingProduct?.kilometersValue ?? null,
      originalPrice: originalPrice ?? null,
    };
  }, [listingProduct, maxOfferAmount, thread?.productImageUrl, thread?.productTitle]);

  useEffect(() => {
    openedOfferMessageIdsRef.current = new Set();
  }, [threadId]);

  useEffect(() => {
    openedAcceptedOfferMessageIdsRef.current = new Set();
  }, [threadId]);

  const handleSend = useCallback(
    async (msgText?: string) => {
      const trimmed = (msgText ?? text).trim();
      const attachmentsToSend = pendingAttachments;
      if ((!trimmed && attachmentsToSend.length === 0) || !user?.id) {
        return;
      }

      setText('');
      setPendingAttachments([]);

      const tempId = `temp-${Date.now()}`;
      dispatch(
        addOptimisticMessage({
          id: tempId,
          senderId: user.id,
          senderRole: thread?.viewerRole === 'buyer' || thread?.viewerRole === 'seller' ? thread.viewerRole : null,
          type: attachmentsToSend.length > 0 ? 'file' : 'text',
          text: trimmed,
          attachments: attachmentsToSend.length
            ? pendingToOptimisticAttachments(attachmentsToSend)
            : [],
          createdAt: new Date().toISOString(),
          read: false,
          readAt: null,
        }),
      );
      try {
        await dispatch(
          sendChatMessage({
            threadId,
            text: trimmed,
            files: attachmentsToSend.length
              ? attachmentsToSend.map(pendingToOutgoingFile)
              : undefined,
          }),
        ).unwrap();
      } catch {
        dispatch(removeOptimisticMessage(tempId));
        setText(trimmed);
        setPendingAttachments(attachmentsToSend);
        Alert.alert('Could not send', 'Your message or photos could not be sent. Please try again.');
      }
    },
    [dispatch, pendingAttachments, text, thread, threadId, user?.id],
  );

  const appendPendingAttachments = useCallback((next: PendingChatAttachment[]) => {
    if (!next.length) {
      return;
    }
    setPendingAttachments(prev => {
      const merged = [...prev, ...next];
      if (merged.length <= MAX_CHAT_ATTACHMENTS) {
        return merged;
      }
      Alert.alert('Limit reached', `You can attach up to ${MAX_CHAT_ATTACHMENTS} images.`);
      return merged.slice(0, MAX_CHAT_ATTACHMENTS);
    });
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const picked = await pickFromCamera();
    appendPendingAttachments(picked);
  }, [appendPendingAttachments, pickFromCamera]);

  const handleChooseGallery = useCallback(async () => {
    const picked = await pickFromGallery(pendingAttachments.length);
    appendPendingAttachments(picked);
  }, [appendPendingAttachments, pendingAttachments.length, pickFromGallery]);

  const handleRemovePendingAttachment = useCallback((id: string) => {
    setPendingAttachments(prev => prev.filter(item => item.id !== id));
  }, []);

  const openMediaSheet = useCallback(() => {
    mediaSheetRef.current?.present();
  }, []);

  const openAttachmentViewer = useCallback(
    (images: string[], initialIndex: number) => {
      if (!images.length) {
        return;
      }
      navigation.navigate('ProductImageViewer', {
        images,
        initialIndex,
      });
    },
    [navigation],
  );

  const sendMessageOrThrow = useCallback(
    async (msgText: string) => {
      const trimmed = msgText.trim();
      if (!trimmed) {
        throw new Error('Message is empty');
      }
      if (!user?.id) {
        throw new Error('Not signed in');
      }
      if (!thread) {
        throw new Error('Chat not ready');
      }

      const tempId = `temp-${Date.now()}`;
      dispatch(
        addOptimisticMessage({
          id: tempId,
          senderId: user.id,
          senderRole: thread.viewerRole === 'buyer' || thread.viewerRole === 'seller' ? thread.viewerRole : null,
          type: 'text',
          text: trimmed,
          createdAt: new Date().toISOString(),
          read: false,
          readAt: null,
        }),
      );
      try {
        await dispatch(sendChatMessage({ threadId, text: trimmed })).unwrap();
      } catch (e) {
        dispatch(removeOptimisticMessage(tempId));
        throw e;
      }
    },
    [dispatch, thread, threadId, user?.id],
  );

  const sendOfferMessage = useCallback(
    async (amount: number) => {
      const label = amount.toLocaleString('en-US');
      await sendMessageOrThrow(`💰 Offer: AED ${label}`);
    },
    [sendMessageOrThrow],
  );

  const acceptOffer = useCallback(
    async (amount: number) => {
      const productId = thread?.productId;
      if (!productId) {
        throw new Error('Missing product for checkout');
      }

      const label = amount.toLocaleString('en-US');
      await sendMessageOrThrow(`✅ Offer accepted for AED ${label}`);
      await CartApi.addFromOffer(threadId, amount);
      if (isBuyer) {
        await refreshCartCount();
      }
    },
    [isBuyer, refreshCartCount, sendMessageOrThrow, thread?.productId, threadId],
  );

  const rejectOffer = useCallback(async () => {
    await sendMessageOrThrow('❌ Offer rejected');
  }, [sendMessageOrThrow]);

  const counterOffer = useCallback(
    async (amount: number) => {
      await sendOfferMessage(amount);
    },
    [sendOfferMessage],
  );

  const openMakeOfferSheet = useCallback(async () => {
    await resolveMaxOffer();
    setMakeOfferOpen(true);
  }, [resolveMaxOffer]);

  const openOfferResponseSheet = useCallback(
    async (offerAmountValue: number, offerMessageId?: string) => {
      if (offerMessageId) {
        openedOfferMessageIdsRef.current.add(offerMessageId);
      }
      setActiveOfferAmount(offerAmountValue);
      await resolveMaxOffer();
      setOfferResponseOpen(true);
    },
    [resolveMaxOffer],
  );

  const handleQuickReplyPress = useCallback(
    (qr: string) => {
      if (qr === 'Make an offer') {
        void openMakeOfferSheet();
        return;
      }
      void handleSend(qr);
    },
    [handleSend, openMakeOfferSheet],
  );

  // Auto-open the offer response sheet when a new offer is received by the viewer.
  useEffect(() => {
    if (!thread || offerResponseOpen || !user?.id || isReelShareDm) return;

    const offerMessages = messages
      .map(m => ({ m, offer: parseOfferAmount(m.text) }))
      .filter(x => Boolean(x.offer) && x.m.type !== 'call');

    if (!offerMessages.length) return;

    const newest = offerMessages[offerMessages.length - 1];
    if (!newest.offer) return;

    // Ignore offers you sent yourself.
    if (newest.m.senderId === user.id) return;

    if (openedOfferMessageIdsRef.current.has(newest.m.id)) return;
    openedOfferMessageIdsRef.current.add(newest.m.id);

    void openOfferResponseSheet(newest.offer.value, newest.m.id);
  }, [isReelShareDm, messages, offerResponseOpen, openOfferResponseSheet, thread, user?.id]);

  // When the seller accepts an offer, the backend adds the listing to the BUYER's
  // cart. The buyer sees an "Offer accepted" message — refresh their cart badge.
  useEffect(() => {
    if (!isBuyer) return;

    const acceptedMessages = messages.filter(m => OFFER_ACCEPTED_RE.test(m.text));
    if (!acceptedMessages.length) return;

    const newest = acceptedMessages[acceptedMessages.length - 1];
    if (openedAcceptedOfferMessageIdsRef.current.has(newest.id)) return;
    openedAcceptedOfferMessageIdsRef.current.add(newest.id);

    void refreshCartCount();
  }, [isBuyer, messages, refreshCartCount]);

  const listHeader = useMemo(() => {
    if (isReelShareDm || !thread?.productImageUrl || thread.kind !== 'product') {
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
          <View style={styles.listingOverlayBottom}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
            {listingPriceLabel ? (
              <Text style={styles.listingPrice}>AED {listingPriceLabel}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }, [isReelShareDm, listingPriceLabel, otherAvatar, thread]);

  const renderGroup = useCallback(
    ({ item }: { item: MessageGroup }) => (
      <View>
        <Text style={styles.dayDivider}>{item.label}</Text>
        {item.messages.map(m => {
          const isSelf = m.senderId === user?.id;
          const offer = parseOfferAmount(m.text);
          const accepted = parseOfferAccepted(m.text);
          return (
            <View key={m.id} style={styles.msgBlock}>
              {offer && m.type !== 'call' ? (
                <OfferMessageBubble
                  offerAmount={offer.value}
                  isSelf={isSelf}
                  otherAvatar={otherAvatar}
                  selfAvatar={selfAvatar}
                  onRespond={
                    isSelf
                      ? undefined
                      : () => void openOfferResponseSheet(offer.value, m.id)
                  }
                />
              ) : accepted && m.type !== 'call' ? (
                <DealAcceptedBubble
                  isSelf={isSelf}
                  otherAvatar={otherAvatar}
                  selfAvatar={selfAvatar}
                />
              ) : OFFER_ACCEPTED_RE.test(m.text ?? '') ? null : (
                <MessageBubble
                  message={m}
                  isSelf={isSelf}
                  otherAvatar={otherAvatar}
                  otherName={other?.name ?? 'User'}
                  selfAvatar={selfAvatar}
                  selfName={user?.name ?? 'You'}
                  onPressAttachment={openAttachmentViewer}
                />
              )}
              <Text style={styles.msgTime}>{formatMessageTime(m.createdAt)}</Text>
            </View>
          );
        })}
      </View>
    ),
    [
      user?.id,
      otherAvatar,
      selfAvatar,
      other?.name,
      user?.name,
      openOfferResponseSheet,
      openAttachmentViewer,
    ],
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
        {thread?.productImageUrl && !isReelShareDm ? (
          <Image source={{ uri: thread.productImageUrl }} style={styles.headerAvatar} />
        ) : (
          <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {isReelShareDm ? other?.name || 'Chat' : thread?.productTitle || other?.name || 'Chat'}
          </Text>
          <Text style={styles.postedText} numberOfLines={1}>
            {isReelShareDm
              ? 'Direct message'
              : formatPostedDate(listingProduct?.createdAt) || 'Posted recently'}
          </Text>
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

        {isBuyer && (
          <Pressable
            hitSlop={12}
            style={styles.cartBtn}
            onPress={startCheckoutPayment}
          >
            <Feather name="cart-outline" size={22} color={THREAD_UI.primary} />
            {cartLoading ? (
              <View style={styles.cartBadge}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
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

      {isBuyer && cartCount > 0 ? (
        <Pressable style={styles.proceedCartBtn} onPress={startCheckoutPayment}>
          <Text style={styles.proceedCartText}>Proceed to cart</Text>
        </Pressable>
      ) : null}

      {showMessageComposer ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRepliesScroll}
            contentContainerStyle={styles.quickRepliesContent}
          >
            {quickReplies.map(qr => (
              <Pressable
                key={qr}
                style={styles.quickChip}
                onPress={() => handleQuickReplyPress(qr)}
              >
                <Text style={styles.quickChipText}>{qr}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ChatAttachmentPreviewBar
            attachments={pendingAttachments}
            onRemove={handleRemovePendingAttachment}
          />

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
              <Pressable style={styles.inputIcon} hitSlop={8} onPress={openMediaSheet}>
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
            {(text.trim().length > 0 || pendingAttachments.length > 0 || sending) && (
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
        </>
      ) : null}

      <MakeOfferSheet
        visible={makeOfferOpen}
        onClose={() => setMakeOfferOpen(false)}
        product={offerProductPreview}
        maxOfferAmount={maxOfferAmount}
        onSendOffer={async amount => {
          await sendOfferMessage(amount);
        }}
      />

      <OfferResponseSheet
        visible={offerResponseOpen}
        onClose={() => setOfferResponseOpen(false)}
        senderName={other?.name ?? 'User'}
        senderAvatar={otherAvatar}
        maxOfferAmount={maxOfferAmount}
        offerAmount={activeOfferAmount}
        onAcceptOffer={async amount => acceptOffer(amount)}
        onRejectOffer={async () => rejectOffer()}
        onSendCounterOffer={async amount => counterOffer(amount)}
      />

      <ChatMediaActionSheet
        ref={mediaSheetRef}
        busy={sending}
        onTakePhoto={() => void handleTakePhoto()}
        onChooseGallery={() => void handleChooseGallery()}
      />
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
    fontSize: 16,
    fontWeight: '700',
    color: THREAD_UI.primary,
  },
  postedText: {
    fontSize: 12,
    color: THREAD_UI.textMuted,
    fontWeight: '500',
    marginTop: 2,
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
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: THREAD_UI.incomingBubble,
  },
  bubble: {
    flexShrink: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },

  bubbleIncoming: {
    backgroundColor: THREAD_UI.incomingBubble,
  },
  bubbleOutgoing: {
    backgroundColor: THREAD_UI.outgoingBubble,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
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
  listingOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  availableBadge: {
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  availableBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listingPrice: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  finalOfferText: {
    fontSize: 15,
    fontWeight: '700',
    color: THREAD_UI.outgoingText,
  },
  dealAcceptedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dealAcceptedText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  proceedCartBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#0000FF',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  proceedCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  quickRepliesScroll: {
    maxHeight: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THREAD_UI.divider,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    height: 38,
    justifyContent: 'center',
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

  cartBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  offerCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    width: '100%',
  },
  offerCardIncoming: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB',
  },
  offerCardOutgoing: {
    backgroundColor: THREAD_UI.outgoingBubble,
    borderColor: '#C7D2FE',
  },
  offerTitle: {
    fontSize: 12,
    color: THREAD_UI.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
  },
  offerAmount: {
    fontSize: 16,
    color: THREAD_UI.primary,
    fontWeight: '900',
  },
  offerHint: {
    marginTop: 6,
    fontSize: 12,
    color: THREAD_UI.textSecondary,
    fontWeight: '600',
  },
});
