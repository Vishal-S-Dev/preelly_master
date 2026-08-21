import { ChatApi } from '../data/api/ChatApi';
import { SharePayload, ShareRecipient } from '../types/share.types';
import { buildShareMessage } from '../utils/shareLinks';

export interface ShareSendResult {
  successCount: number;
  failedCount: number;
}

/**
 * Share a reel/listing to followers, any searched user, or an existing group chat.
 * Backend: POST /api/chats { productId, sellerId: recipientId } for 1:1 (sellerId is the DM peer,
 * not the listing owner); POST /api/chats/group for a brand-new group chat; POST
 * /api/chats/:id/messages to post directly into an existing group. Mirrors web's ReelShareModal.
 */
export const shareService = {
  async sendToRecipients(
    payload: SharePayload,
    recipients: ShareRecipient[],
    messageNote?: string,
    mode: 'individual' | 'group' = 'individual',
  ): Promise<ShareSendResult> {
    const productId = payload.productId ?? payload.contentId;
    const text = buildShareMessage(payload, messageNote);

    const groupRecipients = recipients.filter(r => r.kind === 'group');
    const userRecipients = recipients.filter(r => r.kind !== 'group');

    let successCount = 0;
    let failedCount = 0;

    // Existing group chats always get the content posted directly into them — never spins up a
    // new chat, matching web (selected groups share the same selection set as users, but send
    // straight into the existing conversation regardless of the individual/group mode toggle).
    for (const group of groupRecipients) {
      try {
        await ChatApi.sendMessage(group.id, text);
        successCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    if (userRecipients.length === 0) {
      return { successCount, failedCount };
    }

    if (mode === 'group' && userRecipients.length > 1) {
      // A real group chat (not a text-note simulation) — matches web's createGroup flow. The
      // initial message is posted as part of chat creation itself.
      try {
        await ChatApi.createGroup(
          userRecipients.map(recipient => recipient.id),
          { productId, text },
        );
        successCount += userRecipients.length;
      } catch {
        failedCount += userRecipients.length;
      }
      return { successCount, failedCount };
    }

    for (const recipient of userRecipients) {
      try {
        const { chat } = await ChatApi.createOrGetChat(productId, recipient.id, {
          shareMode: true,
          shareContentType: payload.contentType,
          shareDeepLink: payload.deepLink,
          shareThumbnail: payload.thumbnail,
        });
        await ChatApi.sendMessage(chat._id, text);
        successCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    return { successCount, failedCount };
  },
};
