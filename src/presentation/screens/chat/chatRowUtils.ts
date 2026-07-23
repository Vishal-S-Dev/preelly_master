import { ChatThread } from '../../../domain/models/ChatThread';
import {
  isReelShareThread,
  messageUsesReelLink,
} from '../../../utils/reelShareUtils';

export type ChatRowPresentation = 'direct' | 'product' | 'group';

const GROUP_SHARE_RE = /(?:^|\n\n)Shared with .+, .+/i;

export function isGroupShareMessage(text?: string | null): boolean {
  if (!text) {
    return false;
  }
  return GROUP_SHARE_RE.test(text);
}

export function parseGroupShareNames(text?: string | null): string[] {
  if (!text) {
    return [];
  }
  const match = text.match(/Shared with (.+)$/i);
  if (!match?.[1]) {
    return [];
  }
  return match[1]
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);
}

export function resolveChatRowPresentation(thread: ChatThread): ChatRowPresentation {
  if (thread.kind === 'support') {
    return 'direct';
  }

  if (isGroupShareMessage(thread.lastMessage)) {
    return 'group';
  }

  if (messageUsesReelLink(thread.lastMessage, thread.productId)) {
    return 'direct';
  }

  if (thread.listingOwnerId && isReelShareThread(thread.seller.id, thread.listingOwnerId)) {
    return 'direct';
  }

  return 'product';
}

export function formatActiveStatus(updatedAt: string, unread: number): string {
  if (unread > 0) {
    return unread >= 5 ? '5+ new messages' : `${unread} new message${unread === 1 ? '' : 's'}`;
  }
  return formatPresenceStatus({ isOnline: false, updatedAt });
}

export function formatPresenceStatus(params: {
  isOnline: boolean;
  lastSeen?: string;
  updatedAt?: string;
  hasUnread?: boolean;
}): string {
  if (params.hasUnread) {
    return '';
  }
  if (params.isOnline) {
    return 'Active now';
  }
  const iso = params.lastSeen || params.updatedAt;
  if (!iso) {
    return '';
  }
  const then = new Date(iso).getTime();
  const min = Math.floor((Date.now() - then) / 60_000);
  if (min < 1) {
    return 'Active now';
  }
  if (min < 60) {
    return `Active ${min}m ago`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return `Active ${h}h ago`;
  }
  const d = Math.floor(h / 24);
  return `Active ${d}d ago`;
}

export function formatRelativeTimeShort(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) {
    return 'now';
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return `${h}h`;
  }
  const d = Math.floor(h / 24);
  if (d < 14) {
    return `${d}d`;
  }
  const w = Math.floor(d / 7);
  return `${w}w`;
}

const SHARED_WITH_RE = /\n\nShared with .+$/i;

export function stripSharedWithFooter(text?: string | null): string {
  if (!text) {
    return '';
  }
  return text.replace(SHARED_WITH_RE, '').trim();
}

export function formatInboxPreviewLine(
  lastMessage: string | undefined,
  updatedAt: string,
  productId?: string | null,
): string {
  const time = formatRelativeTimeShort(updatedAt);
  const body = stripSharedWithFooter(lastMessage);

  if (messageUsesReelLink(body, productId) || messageUsesReelLink(lastMessage, productId)) {
    return `Sent a reel · ${time}`;
  }
  if (/missed.*call|audio call|video call/i.test(body)) {
    return `You missed an audio call · ${time}`;
  }
  if (/^seen$/i.test(body)) {
    return `Seen · ${time}`;
  }
  const firstLine = body.split('\n').find(line => line.trim())?.trim();
  if (firstLine) {
    return `${firstLine} · ${time}`;
  }
  return `Sent a message · ${time}`;
}

export function buildGroupTitle(names: string[]): string {
  const unique = [...new Set(names.map(n => n.trim()).filter(Boolean))];
  if (!unique.length) {
    return 'Group';
  }
  return unique.join(', ');
}
