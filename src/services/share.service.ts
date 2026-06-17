import { ChatApi } from '../data/api/ChatApi';
import { SharePayload, ShareRecipient } from '../types/share.types';
import { buildShareMessage } from '../utils/shareLinks';

export interface ShareSendResult {
  successCount: number;
  failedCount: number;
}

/**
 * Shares listing content in chat using existing createOrGetChat + sendMessage APIs.
 * Passes recipient as counterparty id (sellerId param) with share metadata in options.
 */
export const shareService = {
  async sendToRecipients(
    payload: SharePayload,
    recipients: ShareRecipient[],
    messageNote?: string,
    mode: 'individual' | 'group' = 'individual',
  ): Promise<ShareSendResult> {
    const productId = payload.productId ?? payload.contentId;
    const listingSellerId = payload.sellerId ?? productId;
    const text = buildShareMessage(payload, messageNote);

    const finalText =
      mode === 'group' && recipients.length > 1
        ? `${text}\n\nShared with ${recipients.map(r => r.name).join(', ')}`
        : text;

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const { chat } = await ChatApi.createOrGetChat(productId, recipient.id, {
          sellerId: listingSellerId,
          shareContentType: payload.contentType,
          shareDeepLink: payload.deepLink,
          shareThumbnail: payload.thumbnail,
        });
        await ChatApi.sendMessage(chat._id, finalText);
        successCount += 1;
      } catch {
        try {
          const { chat } = await ChatApi.createOrGetChat(productId, listingSellerId, {
            recipientId: recipient.id,
            shareContentType: payload.contentType,
          });
          await ChatApi.sendMessage(chat._id, finalText);
          successCount += 1;
        } catch {
          failedCount += 1;
        }
      }
    }

    return { successCount, failedCount };
  },
};
