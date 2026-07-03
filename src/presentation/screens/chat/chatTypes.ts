import { ChatThread } from '../../../domain/models/ChatThread';
import { getDisplayAvatarUri } from '../../../utils/mediaUrl';

export type ChatFilter = 'All' | 'Buying' | 'Selling' | 'Unread' | 'Following';

export type ChatRow =
  | {
      id: string;
      kind: 'product';
      productTitle: string;
      contactName: string;
      contactVerified: boolean;
      productImageUri: string;
      contactAvatarUri: string;
      overlapDot: 'green' | 'red' | 'none';
      previewText?: string;
      unreadLabel?: string;
      timeAgo?: string;

    }
  | {
      id: string;
      kind: 'direct';
      userName: string;
      avatarUri: string;
      activeStatus: string;
      showOnlineDot: boolean;
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

export function mapThreadsToChatRows(threads: ChatThread[]): ChatRow[] {
  return threads.map(thread => {
    if (thread.kind === 'support') {
      return {
        id: thread.id,
        kind: 'direct',
        userName: 'Support',
        avatarUri: SUPPORT_AVATAR,
        activeStatus: thread.lastMessage || 'We are here to help',
        showOnlineDot: true,
      };
    }

    const other = thread.viewerRole === 'buyer' ? thread.seller : thread.buyer;
    const unread = thread.unreadForViewer;
    const overlapDot: 'green' | 'red' | 'none' = unread > 0 ? 'red' : 'green';

    return {
      id: thread.id,
      kind: 'product',
      productTitle: thread.productTitle || 'Listing',
      contactName: other.name,
      contactVerified: other.isVerified,
      productImageUri: thread.productImageUrl || PLACEHOLDER,
      contactAvatarUri:
        getDisplayAvatarUri(other.avatarUrl, other.name) || PLACEHOLDER,
      overlapDot,
      ...(unread > 0
        ? {
            unreadLabel: unreadLabelText(unread),
            timeAgo: formatRelativeTime(thread.updatedAt),
          }
        : {
            previewText: thread.lastMessage || '',
          }),
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

    return (
      row.userName.toLowerCase().includes(normalized) ||
      row.activeStatus.toLowerCase().includes(normalized)
    );
  });
}

export function filterThreads(threads: ChatThread[], filter: ChatFilter): ChatThread[] {
  switch (filter) {
    case 'Buying':
      return threads.filter(t => t.kind === 'product' && t.viewerRole === 'buyer');
    case 'Selling':
      return threads.filter(t => t.kind === 'product' && t.viewerRole === 'seller');
    case 'Unread':
      return threads.filter(t => t.unreadForViewer > 0);
    case 'Following':
      return threads;
    case 'All':
    default:
      return threads;
  }
}
