import { ChatApi } from '../data/api/ChatApi';
import { UserApi } from '../data/api/UserApi';
import { ChatDocumentDTO } from '../data/dto/ChatDTO';
import { BlockedUsersResponseDTO, UserSearchResponseDTO } from '../types/blockedUsers.types';

export const USER_REPORT_REASONS = [
  'Spam or scam',
  'Harassment or abuse',
  'Inappropriate content',
  'Fraudulent listing',
  'Other',
] as const;

export type UserReportReason = (typeof USER_REPORT_REASONS)[number];

const partyId = (party: ChatDocumentDTO['buyer']): string | null => {
  if (!party) {
    return null;
  }
  if (typeof party === 'string') {
    return party;
  }
  return party._id ? String(party._id) : null;
};

export const findChatsWithUser = (
  chats: ChatDocumentDTO[],
  otherUserId: string,
): ChatDocumentDTO[] => {
  const target = String(otherUserId);
  return chats.filter(chat => {
    if (chat.type === 'support') {
      return false;
    }
    const buyerId = partyId(chat.buyer);
    const sellerId = partyId(chat.seller);
    return buyerId === target || sellerId === target;
  });
};

export const isChatMutedForUser = (chat: ChatDocumentDTO, viewerUserId: string): boolean => {
  const uid = String(viewerUserId);
  if (typeof chat.muted === 'boolean') {
    return chat.muted;
  }
  return (chat.mutedBy ?? []).some(id => String(id) === uid);
};

const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

export const userSafetyService = {
  async blockUser(userId: string): Promise<{ blocked: boolean; message: string }> {
    try {
      return await UserApi.blockUser(userId);
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to block user'));
    }
  },

  async unblockUser(userId: string): Promise<{ blocked: boolean; message: string }> {
    try {
      return await UserApi.unblockUser(userId);
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to unblock user'));
    }
  },

  async getBlockedUsers(params: {
    page: number;
    limit: number;
    q?: string;
  }): Promise<BlockedUsersResponseDTO> {
    try {
      return await UserApi.getBlockedUsers(params);
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to load blocked users'));
    }
  },

  async searchUsers(q: string, limit = 20): Promise<UserSearchResponseDTO> {
    try {
      return await UserApi.searchUsers(q, limit);
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to search users'));
    }
  },

  async getChatsWithUser(otherUserId: string): Promise<ChatDocumentDTO[]> {
    const chats = await ChatApi.getChats();
    return findChatsWithUser(chats, otherUserId);
  },

  async areNotificationsMuted(otherUserId: string, viewerUserId: string): Promise<boolean> {
    const chats = await this.getChatsWithUser(otherUserId);
    if (!chats.length) {
      return false;
    }
    return chats.every(chat => isChatMutedForUser(chat, viewerUserId));
  },

  /**
   * Toggle mute on every 1:1 product chat with this user.
   * If any chat is unmuted, mute all; if all muted, unmute all.
   */
  async toggleMuteForUser(
    otherUserId: string,
    viewerUserId: string,
  ): Promise<{ muted: boolean; message: string; chatCount: number }> {
    try {
      const chats = await this.getChatsWithUser(otherUserId);
      if (!chats.length) {
        throw new Error(
          'No conversation found with this user yet. Start a chat to mute notifications.',
        );
      }

      const allMuted = chats.every(chat => isChatMutedForUser(chat, viewerUserId));
      const shouldMute = !allMuted;

      await Promise.all(
        chats.map(async chat => {
          const currentlyMuted = isChatMutedForUser(chat, viewerUserId);
          if (currentlyMuted === shouldMute) {
            return;
          }
          await ChatApi.toggleMute(chat._id);
        }),
      );

      return {
        muted: shouldMute,
        chatCount: chats.length,
        message: shouldMute ? 'Notifications muted' : 'Notifications unmuted',
      };
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to update notifications'));
    }
  },

  /**
   * Report a user via an existing (or newly opened) product chat — same API as web.
   */
  async reportUser(options: {
    reportedUserId: string;
    reason: string;
    details?: string;
    productId?: string | null;
  }): Promise<{ message: string; reportId?: string }> {
    try {
      const chats = await this.getChatsWithUser(options.reportedUserId);
      let chatId = chats[0]?._id ?? null;

      if (!chatId && options.productId) {
        const { chat } = await ChatApi.createOrGetChat(options.productId, options.reportedUserId);
        chatId = chat._id;
      }

      if (!chatId) {
        throw new Error(
          'No conversation found with this user yet. Open a chat from one of their listings to submit a report.',
        );
      }

      return await ChatApi.reportUser(chatId, {
        reason: options.reason,
        details: options.details,
        reportedUserId: options.reportedUserId,
      });
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Failed to submit report'));
    }
  },
};
