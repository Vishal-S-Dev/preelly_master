import { ChatThread } from '../../../domain/models/ChatThread';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';
import {
  buildGroupTitle,
  formatActiveStatus,
  formatInboxPreviewLine,
  parseGroupShareNames,
  resolveChatRowPresentation,
} from './chatRowUtils';

export type ChatFilter = 'All' | 'Buying' | 'Selling' | 'Unread' | 'Following' | 'Groups';

export type ChatRow =
  | {
      id: string;
      kind: 'product';
      productTitle: string;
      contactName: string;
      contactVerified: boolean;
      productImageUri: string;
      contactAvatarUri: string;
      contactUserId: string;
      previewText?: string;
      unreadLabel?: string;
      timeAgo?: string;
    }
  | {
      id: string;
      kind: 'direct';
      userName: string;
      avatarUri: string;
      contactVerified: boolean;
      contactUserId: string;
      alwaysOnline?: boolean;
      updatedAt: string;
      activeStatus: string;
      previewText?: string;
      unreadLabel?: string;
      timeAgo?: string;
    }
  | {
      id: string;
      kind: 'group';
      title: string;
      backAvatarUri: string;
      backName: string;
      frontAvatarUri: string;
      frontName: string;
      contactUserId: string;
      previewText?: string;
      unreadLabel?: string;
      timeAgo?: string;
    };

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200/200';
const SUPPORT_AVATAR =
  'https://ui-avatars.com/api/?name=Support&background=2563EB&color=fff&size=128';

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
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

function unreadLabelText(count: number): string {
  if (count >= 5) {
    return '5+ new messages';
  }
  if (count === 1) {
    return '1 new message';
  }
  return `${count} new messages`;
}

function otherParticipant(thread: ChatThread) {
  return thread.viewerRole === 'buyer' ? thread.seller : thread.buyer;
}

function unreadMeta(thread: ChatThread) {
  const unread = thread.unreadForViewer;
  if (unread <= 0) {
    return {
      previewText: thread.lastMessage || '',
    };
  }
  return {
    unreadLabel: unreadLabelText(unread),
    timeAgo: formatRelativeTime(thread.updatedAt),
  };
}

export function mapThreadsToChatRows(threads: ChatThread[]): ChatRow[] {
  return threads.map(thread => {
    if (thread.kind === 'support') {
      return {
        id: thread.id,
        kind: 'direct',
        userName: 'Support',
        avatarUri: SUPPORT_AVATAR,
        contactVerified: true,
        contactUserId: 'support',
        alwaysOnline: true,
        updatedAt: thread.updatedAt,
        activeStatus: thread.lastMessage || 'We are here to help',
        ...unreadMeta(thread),
      };
    }

    const other = otherParticipant(thread);
    const unread = thread.unreadForViewer;
    const contactAvatarUri = getDisplayAvatarUri(other.avatarUrl, other.name) || PLACEHOLDER;
    const contactUserId = other.id;
    const presentation = resolveChatRowPresentation(thread);

    if (presentation === 'group') {
      const sharedNames = parseGroupShareNames(thread.lastMessage);
      const participantNames = [thread.buyer.name, thread.seller.name].filter(Boolean);
      const titleNames = sharedNames.length >= 2 ? sharedNames : participantNames;
      const title = buildGroupTitle(titleNames);

      const backName = sharedNames[0] ?? other.name;
      const frontName =
        sharedNames.find(name => name !== backName) ??
        sharedNames[1] ??
        (thread.viewerRole === 'buyer' ? thread.seller.name : thread.buyer.name);

      const resolveNameAvatar = (name: string) => {
        if (name === other.name) {
          return contactAvatarUri;
        }
        if (name === thread.buyer.name) {
          return getDisplayAvatarUri(thread.buyer.avatarUrl, thread.buyer.name) || PLACEHOLDER;
        }
        if (name === thread.seller.name) {
          return getDisplayAvatarUri(thread.seller.avatarUrl, thread.seller.name) || PLACEHOLDER;
        }
        return (
          getDisplayAvatarUri('', name) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=E5E7EB&color=374151`
        );
      };

      const previewText = formatInboxPreviewLine(
        thread.lastMessage,
        thread.updatedAt,
        thread.productId,
      );

      return {
        id: thread.id,
        kind: 'group',
        title,
        backAvatarUri: resolveNameAvatar(backName),
        backName,
        frontAvatarUri: resolveNameAvatar(frontName),
        frontName,
        contactUserId,
        previewText,
        ...(unread > 0
          ? {
              unreadLabel: unreadLabelText(unread),
              timeAgo: formatRelativeTime(thread.updatedAt),
            }
          : {}),
      };
    }

    if (presentation === 'direct') {
      const previewText = formatInboxPreviewLine(
        thread.lastMessage,
        thread.updatedAt,
        thread.productId,
      );
      return {
        id: thread.id,
        kind: 'direct',
        userName: other.name,
        avatarUri: contactAvatarUri,
        contactVerified: other.isVerified,
        contactUserId,
        updatedAt: thread.updatedAt,
        activeStatus: formatActiveStatus(thread.updatedAt, unread),
        previewText,
        ...(unread > 0
          ? {
              unreadLabel: unreadLabelText(unread),
              timeAgo: formatRelativeTime(thread.updatedAt),
            }
          : {}),
      };
    }

    return {
      id: thread.id,
      kind: 'product',
      productTitle: thread.productTitle || 'Listing',
      contactName: other.name,
      contactVerified: other.isVerified,
      productImageUri: thread.productImageUrl || PLACEHOLDER,
      contactAvatarUri,
      contactUserId,
      ...unreadMeta(thread),
    };
  });
}

export function searchChatRows(rows: ChatRow[], query: string): ChatRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return rows;
  }

  return rows.filter(row => {
    if (row.kind === 'product') {
      return (
        row.productTitle.toLowerCase().includes(normalized) ||
        row.contactName.toLowerCase().includes(normalized) ||
        row.previewText?.toLowerCase().includes(normalized) ||
        row.unreadLabel?.toLowerCase().includes(normalized)
      );
    }

    if (row.kind === 'group') {
      return (
        row.title.toLowerCase().includes(normalized) ||
        row.previewText?.toLowerCase().includes(normalized) ||
        row.unreadLabel?.toLowerCase().includes(normalized)
      );
    }

    return (
      row.userName.toLowerCase().includes(normalized) ||
      row.activeStatus.toLowerCase().includes(normalized) ||
      row.previewText?.toLowerCase().includes(normalized) ||
      row.unreadLabel?.toLowerCase().includes(normalized)
    );
  });
}

export function filterThreads(threads: ChatThread[], filter: ChatFilter): ChatThread[] {
  switch (filter) {
    case 'Buying':
      return threads.filter(
        t =>
          t.kind === 'product' &&
          t.viewerRole === 'buyer' &&
          resolveChatRowPresentation(t) === 'product',
      );
    case 'Selling':
      return threads.filter(
        t =>
          t.kind === 'product' &&
          t.viewerRole === 'seller' &&
          resolveChatRowPresentation(t) === 'product',
      );
    case 'Unread':
      return threads.filter(t => t.unreadForViewer > 0);
    case 'Groups':
      return threads.filter(t => resolveChatRowPresentation(t) === 'group');
    case 'Following':
      return threads;
    case 'All':
    default:
      return threads;
  }
}
