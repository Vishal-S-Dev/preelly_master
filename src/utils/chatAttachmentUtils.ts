import { Asset } from 'react-native-image-picker';
import { ChatOutgoingFile } from '../data/api/ChatApi';
import { ChatMessageAttachment } from '../domain/models/ChatThread';
import { resolveMediaUrl } from './mediaUrl';

export const MAX_CHAT_ATTACHMENTS = 10;
export const MAX_CHAT_IMAGE_BYTES = 25 * 1024 * 1024;

export interface PendingChatAttachment {
  id: string;
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const IMAGE_MIME_RE = /^image\//i;

export const isImageAttachment = (attachment: ChatMessageAttachment): boolean =>
  IMAGE_MIME_RE.test(attachment.mimeType ?? '') ||
  /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(attachment.name ?? attachment.url);

export const resolveAttachmentUrl = (url: string): string => {
  if (!url) {
    return '';
  }
  if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('http')) {
    return url;
  }
  return resolveMediaUrl(url) || url;
};

export const mapAttachmentsFromDto = (raw: unknown): ChatMessageAttachment[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(item => {
      const record = item as Record<string, unknown>;
      const url = String(record.url ?? '');
      if (!url) {
        return null;
      }
      return {
        url,
        mimeType: typeof record.mimeType === 'string' ? record.mimeType : undefined,
        name: typeof record.name === 'string' ? record.name : undefined,
        size: typeof record.size === 'number' ? record.size : undefined,
        local: Boolean(record._local ?? record.local),
      } satisfies ChatMessageAttachment;
    })
    .filter(Boolean) as ChatMessageAttachment[];
};

export const resolveMessageAttachments = (
  attachments?: ChatMessageAttachment[] | null,
  attachment?: ChatMessageAttachment | null,
): ChatMessageAttachment[] => {
  if (attachments?.length) {
    return attachments;
  }
  return attachment ? [attachment] : [];
};

export const assetToPendingAttachment = (asset: Asset, index = 0): PendingChatAttachment | null => {
  if (!asset.uri) {
    return null;
  }
  const type = asset.type || 'image/jpeg';
  const ext = type.split('/')[1] || 'jpg';
  const name = asset.fileName || `photo_${Date.now()}_${index}.${ext}`;
  return {
    id: `pending_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    uri: asset.uri,
    name,
    type,
    size: asset.fileSize,
  };
};

export const pendingToOutgoingFile = (attachment: PendingChatAttachment): ChatOutgoingFile => ({
  uri: attachment.uri,
  name: attachment.name,
  type: attachment.type,
});

export const pendingToOptimisticAttachments = (
  attachments: PendingChatAttachment[],
): ChatMessageAttachment[] =>
  attachments.map(item => ({
    url: item.uri,
    mimeType: item.type,
    name: item.name,
    size: item.size,
    local: true,
  }));

export const validatePendingAttachment = (attachment: PendingChatAttachment): string | null => {
  if (!attachment.type.startsWith('image/')) {
    return 'Only image files can be sent in chat.';
  }
  if (typeof attachment.size === 'number' && attachment.size > MAX_CHAT_IMAGE_BYTES) {
    return 'Each image must be 25 MB or smaller.';
  }
  return null;
};
