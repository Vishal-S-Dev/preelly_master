import { User } from '../models/User';
import { ChatMessage, ChatThread } from '../models/ChatThread';
import { ChatRepository, ChatThreadWithMessages } from '../repository/ChatRepository';

export class LoadChatsUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(viewerId: string): Promise<ChatThread[]> {
    return this.repository.getThreads(viewerId);
  }
}

export class GetUnreadChatCountUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(): Promise<number> {
    return this.repository.getUnreadTotal();
  }
}

export class GetChatByIdUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(threadId: string, viewerId: string): Promise<ChatThreadWithMessages> {
    return this.repository.getThreadWithMessages(threadId, viewerId);
  }
}

export class MarkChatReadUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(threadId: string): Promise<void> {
    return this.repository.markAsRead(threadId);
  }
}

export class CreateOrGetChatUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(
    productId: string,
    sellerId: string,
    viewer: User,
    options?: Record<string, unknown>,
  ): Promise<ChatThreadWithMessages> {
    return this.repository.createOrGetChat(productId, sellerId, viewer.id, options);
  }
}

export class CreateSupportChatUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(viewer: User): Promise<ChatThreadWithMessages> {
    return this.repository.createSupportChat(viewer);
  }
}

export class SendChatMessageUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(
    threadId: string,
    text: string,
    viewer: User,
    senderRole: 'buyer' | 'seller' | null,
    files?: { uri: string; name: string; type: string }[] | null,
  ): Promise<ChatMessage> {
    return this.repository.sendMessage(threadId, text, viewer.id, senderRole, files);
  }
}

export class DeleteChatUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(threadId: string): Promise<void> {
    return this.repository.deleteThread(threadId);
  }
}

export class DeleteChatMessageUseCase {
  constructor(private readonly repository: ChatRepository) {}

  execute(threadId: string, messageId: string): Promise<void> {
    return this.repository.deleteMessage(threadId, messageId);
  }
}
