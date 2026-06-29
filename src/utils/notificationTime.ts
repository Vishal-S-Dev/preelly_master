export const formatNotificationTimeAgo = (dateStr: string): string => {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) {
    return '';
  }

  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.floor(hrs / 24);
  if (days === 1) {
    return '1d ago';
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getNotificationDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Older';
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  if (date >= weekAgo) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return 'Older';
};
