import { ChatApi, ChatOutgoingFile } from '../api/ChatApi';
import { ChatDocumentDTO, ChatMessageDTO, ChatUserRefDTO } from '../dto/ChatDTO';
import { ProductDTO } from '../dto/ProductDTO';
import { ChatMessage, ChatParticipant, ChatThread, ChatThreadKind } from '../../domain/models/ChatThread';
import { mapAttachmentsFromDto } from '../../utils/chatAttachmentUtils';
import { resolveListingOwnerId } from '../../utils/reelShareUtils';
import { User } from '../../domain/models/User';
import { ChatRepository, ChatThreadWithMessages } from '../../domain/repository/ChatRepository';
import { getDisplayAvatarUri, resolveMediaUrl } from '../../utils/mediaUrl';

const refId = (ref: string | { _id?: string } | null | undefined): string | null => {
  if (ref == null) {
    return null;
  }
  if (typeof ref === 'string') {
    return ref;
  }
  return ref._id ?? null;
};

const mapParticipant = (ref: ChatUserRefDTO | string | null | undefined): ChatParticipant => {
  if (!ref || typeof ref === 'string') {
    return { id: ref ?? '', name: 'User', avatarUrl: '', isVerified: false };
  }
  const avatarUrl =
    typeof ref !== 'string' && ref
      ? getDisplayAvatarUri(ref.avatar, ref.name || ref.username) ?? ''
      : '';
  return {
    id: ref._id,
    name: ref.name || ref.username || 'User',
    avatarUrl,
    isVerified: Boolean(ref.isVerified),
  };
};

const productImageFromDto = (product: ChatDocumentDTO['product']): string => {
  if (!product || typeof product === 'string') {
    return '';
  }
  if (product.images?.length) {
    const firstImage = product.images.find(path => !path.toLowerCase().endsWith('.mp4'));
    return resolveMediaUrl(firstImage ?? product.images[0]) || '';
  }
  if (typeof product.image === 'string' && product.image.trim()) {
    return resolveMediaUrl(product.image) || '';
  }
  if (product.video) {
    return resolveMediaUrl(product.video) || '';
  }
  return '';
};

const mapMessage = (message: ChatMessageDTO): ChatMessage => {
  const senderId = typeof message.sender === 'object' && message.sender
    ? message.sender._id
    : typeof message.sender === 'string'
      ? message.sender
      : null;
  const callMeta = message.callMeta as ChatMessage['callMeta'];
  const attachments = mapAttachmentsFromDto(message.attachments);
  const attachmentRaw = message.attachment as Record<string, unknown> | null | undefined;
  const attachment = attachmentRaw?.url
    ? mapAttachmentsFromDto([attachmentRaw])[0] ?? null
    : null;
  return {
    id: message._id,
    senderId,
    senderRole: (message.senderRole as ChatMessage['senderRole']) ?? null,
    type: message.type || 'text',
    text: message.text || '',
    createdAt: message.createdAt || new Date().toISOString(),
    read: Boolean(message.read),
    readAt: message.readAt ?? null,
    callMeta: callMeta ?? null,
    attachments: attachments.length ? attachments : attachment ? [attachment] : [],
    attachment,
  };
};

const mapDocumentToThread = (chat: ChatDocumentDTO, viewerId: string): ChatThread => {
  const id = chat._id;
  const kind: ChatThreadKind = chat.type === 'support' ? 'support' : 'product';
  const updatedAt = chat.lastMessageAt || chat.updatedAt || new Date().toISOString();
  const lastMessage = chat.lastMessage || '';

  if (kind === 'support') {
    const customer = mapParticipant(
      typeof chat.user === 'object' && chat.user ? chat.user : null,
    );
    const unread = chat.unreadForUser ?? 0;
    return {
      id,
      kind: 'support',
      updatedAt,
      productId: null,
      productTitle: 'Support',
      productImageUrl: '',
      buyer: customer,
      seller: { id: 'support', name: 'Support', avatarUrl: '', isVerified: true },
      supportCustomer: customer,
      lastMessage,
      unreadForViewer: unread,
      viewerRole: 'support',
    };
  }

  const buyer = mapParticipant(typeof chat.buyer === 'object' ? chat.buyer : null);
  const seller = mapParticipant(typeof chat.seller === 'object' ? chat.seller : null);
  const viewerIsBuyer = buyer.id === viewerId;
  const unreadForViewer = viewerIsBuyer
    ? chat.unreadForBuyer ?? 0
    : chat.unreadForSeller ?? 0;
  const productId = refId(chat.product);
  const productTitle =
    typeof chat.product === 'object' && chat.product?.title ? chat.product.title : '';
  const productImageUrl = productImageFromDto(chat.product);
  const listingOwnerId =
    typeof chat.product === 'object' && chat.product
      ? resolveListingOwnerId(chat.product as ProductDTO)
      : null;

  return {
    id,
    kind: 'product',
    updatedAt,
    productId,
    productTitle,
    productImageUrl,
    listingOwnerId,
    buyer,
    seller,
    supportCustomer: null,
    lastMessage,
    unreadForViewer,
    viewerRole: viewerIsBuyer ? 'buyer' : 'seller',
  };
};

const assignSenderRoles = (
  messages: ChatMessage[],
  buyerId: string,
  sellerId: string,
): ChatMessage[] =>
  messages.map(m => ({
    ...m,
    senderRole:
      m.senderId === buyerId ? 'buyer' : m.senderId === sellerId ? 'seller' : m.senderRole,
  }));

export class ChatRepositoryImpl implements ChatRepository {
  async getThreads(viewerId: string): Promise<ChatThread[]> {
    const chats = await ChatApi.getChats();
    return chats.map(c => mapDocumentToThread(c, viewerId));
  }

  async getUnreadTotal(): Promise<number> {
    return ChatApi.getUnreadCount();
  }

  async getThreadWithMessages(threadId: string, viewerId: string): Promise<ChatThreadWithMessages> {
    const { chat, messages } = await ChatApi.getChatById(threadId);
    const thread = mapDocumentToThread(chat, viewerId);
    const raw = (messages || []).map(mapMessage);
    const buyerId = thread.buyer.id;
    const sellerId = thread.seller.id;
    return {
      thread,
      messages: assignSenderRoles(raw, buyerId, sellerId),
    };
  }

  async markAsRead(threadId: string): Promise<void> {
    await ChatApi.markAsRead(threadId);
  }

  async createOrGetChat(
    productId: string,
    sellerId: string,
    viewerId: string,
    options?: Record<string, unknown>,
  ): Promise<ChatThreadWithMessages> {
    const { chat, messages } = await ChatApi.createOrGetChat(productId, sellerId, options ?? {});
    const thread = mapDocumentToThread(chat, viewerId);
    const raw = (messages || []).map(mapMessage);
    return {
      thread,
      messages: assignSenderRoles(raw, thread.buyer.id, thread.seller.id),
    };
  }

  async createSupportChat(viewer: User): Promise<ChatThreadWithMessages> {
    const { chat, messages } = await ChatApi.createSupportChat();
    const thread = mapDocumentToThread(chat, viewer.id);
    const raw = (messages || []).map(mapMessage);
    return {
      thread,
      messages: assignSenderRoles(raw, thread.buyer.id, thread.seller.id),
    };
  }

  async sendMessage(
    threadId: string,
    text: string,
    _senderId: string,
    senderRole: 'buyer' | 'seller' | null,
    files?: ChatOutgoingFile[] | null,
  ): Promise<ChatMessage> {
    const message = await ChatApi.sendMessage(threadId, text, files);
    const mapped = mapMessage(message);
    return { ...mapped, senderRole: senderRole ?? mapped.senderRole };
  }

  async deleteThread(threadId: string): Promise<void> {
    await ChatApi.deleteChat(threadId);
  }

  async deleteMessage(threadId: string, messageId: string): Promise<void> {
    await ChatApi.deleteMessage(threadId, messageId);
  }
}
