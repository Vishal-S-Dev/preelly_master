import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  ChatDocumentDTO,
  ChatMessageDTO,
  ChatWithMessagesDTO,
  UnreadCountDTO,
} from '../dto/ChatDTO';
import { httpClient } from './httpClient';

function chatByIdPath(chatId: string): string {
  return `${API_ENDPOINTS.CHATS}/${chatId}`;
}

function chatMessagePath(chatId: string, messageId: string): string {
  return `${API_ENDPOINTS.CHATS}/${chatId}/messages/${messageId}`;
}

export type ChatOutgoingFile = { uri: string; name: string; type: string };

export const ChatApi = {
  async getChats(): Promise<ChatDocumentDTO[]> {
    const { data } = await httpClient.get<ChatDocumentDTO[] | { chats: ChatDocumentDTO[] }>(
      API_ENDPOINTS.CHATS,
    );
    if (Array.isArray(data)) {
      return data;
    }
    return data?.chats ?? [];
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await httpClient.get<UnreadCountDTO>(API_ENDPOINTS.CHATS_UNREAD_COUNT);
    return typeof data?.unread === 'number' ? data.unread : 0;
  },

  async getChatById(chatId: string): Promise<ChatWithMessagesDTO> {
    const { data } = await httpClient.get<ChatWithMessagesDTO>(chatByIdPath(chatId));
    return data;
  },

  async createOrGetChat(
    productId: string,
    sellerId: string,
    options: Record<string, unknown> = {},
  ): Promise<ChatWithMessagesDTO> {
    const { data } = await httpClient.post<ChatWithMessagesDTO>(API_ENDPOINTS.CHATS, {
      productId,
      sellerId,
      ...options,
    });
    return data;
  },

  async createSupportChat(): Promise<ChatWithMessagesDTO> {
    const { data } = await httpClient.post<ChatWithMessagesDTO>(API_ENDPOINTS.CHATS, {
      type: 'support',
    });
    return data;
  },

  async sendMessage(
    chatId: string,
    text: string,
    files?: ChatOutgoingFile[] | null,
  ): Promise<ChatMessageDTO> {
    const fileList = files?.length ? files : [];
    if (fileList.length > 0) {
      const fd = new FormData();
      if (text) {
        fd.append('text', text);
      }
      fileList.forEach(f => {
        fd.append('files', f);
      });
      const { data } = await httpClient.post<ChatMessageDTO>(`${chatByIdPath(chatId)}/messages`, fd);
      return data;
    }
    const { data } = await httpClient.post<ChatMessageDTO>(`${chatByIdPath(chatId)}/messages`, {
      text,
    });
    return data;
  },

  async markAsRead(chatId: string): Promise<void> {
    await httpClient.put(`${chatByIdPath(chatId)}/read`);
  },

  async deleteChat(chatId: string): Promise<void> {
    await httpClient.delete(chatByIdPath(chatId));
  },

  async deleteMessage(chatId: string, messageId: string): Promise<{ chat?: ChatDocumentDTO }> {
    const { data } = await httpClient.delete<{ chat?: ChatDocumentDTO }>(chatMessagePath(chatId, messageId));
    return data ?? {};
  },

  async saveCallEvent(
    chatId: string,
    data: { callType: string; status: string; duration: number },
  ): Promise<void> {
    await httpClient.post(`${chatByIdPath(chatId)}/call-event`, data);
  },
};
