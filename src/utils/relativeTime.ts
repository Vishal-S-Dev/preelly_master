/**
 * Short-form relative time for compact metadata rows (e.g. "1 Pin · 2mo", "26 Pins · 6y").
 * Unlike `notificationTime.ts` (which falls back to a calendar date past a week),
 * this always resolves to a short unit so board/board-item metadata stays a single token.
 */
export const formatRelativeTimeShort = (dateStr?: string | null): string => {
  if (!dateStr) {
    return '';
  }
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) {
    return '';
  }

  const diffMs = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }

  const years = Math.floor(days / 365);
  return `${years}y`;
};

export const formatPinCountLabel = (count: number): string =>
  `${count.toLocaleString()} ${count === 1 ? 'Item' : 'Items'}`;
