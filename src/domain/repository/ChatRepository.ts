import { ChatMessage, ChatThread } from '../models/ChatThread';
import { User } from '../models/User';

export interface ChatThreadWithMessages {
  thread: ChatThread;
  messages: ChatMessage[];
}

export interface ChatRepository {
  getThreads(viewerId: string): Promise<ChatThread[]>;
  getUnreadTotal(): Promise<number>;
  getThreadWithMessages(threadId: string, viewerId: string): Promise<ChatThreadWithMessages>;
  markAsRead(threadId: string): Promise<void>;
  createOrGetChat(
    productId: string,
    sellerId: string,
    viewerId: string,
    options?: Record<string, unknown>,
  ): Promise<ChatThreadWithMessages>;
  createSupportChat(viewer: User): Promise<ChatThreadWithMessages>;
  sendMessage(
    threadId: string,
    text: string,
    senderId: string,
    senderRole: 'buyer' | 'seller' | null,
    files?: { uri: string; name: string; type: string }[] | null,
  ): Promise<ChatMessage>;
  deleteThread(threadId: string): Promise<void>;
  deleteMessage(threadId: string, messageId: string): Promise<void>;
}
