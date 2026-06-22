import { ChatMessage } from '../../../domain/models/ChatThread';

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }
  if (d.toDateString() === yest.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface MessageGroup {
  label: string;
  messages: ChatMessage[];
}

export function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const filtered = messages.filter(m => m.id !== 'last-message');
  const out: MessageGroup[] = [];
  let lastDay = '';
  for (const m of filtered) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== lastDay) {
      lastDay = day;
      out.push({ label: dayLabel(m.createdAt), messages: [] });
    }
    out[out.length - 1].messages.push(m);
  }
  return out;
}

export function formatCallDuration(secs: number): string {
  if (!secs || secs <= 0) {
    return '';
  }
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}
