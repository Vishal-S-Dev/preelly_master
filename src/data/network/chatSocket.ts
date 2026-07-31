import { io, Socket } from 'socket.io-client';
import { ENV } from '../../constants/env';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { storage } from '../../utils/storage';
import { attachCallSignalingListeners } from './callSignaling';

/**
 * Match web `resolveSocketTarget`:
 * API base `https://beta.preelly.xyz/preelly-api` → origin + path `/preelly-api/socket.io`
 * Local `http://host:8029` (no subpath) → `/socket.io`
 *
 * Passing `/preelly-api` in the io() URL makes Socket.IO treat it as a namespace
 * and still hit `/socket.io` at the host root — which nginx does not forward.
 */
function resolveSocketTarget(apiBaseUrl: string): { url: string; path: string } {
  try {
    const u = new URL(apiBaseUrl);
    const base = u.pathname.replace(/\/+$/, '').replace(/\/api$/i, '');
    return {
      url: u.origin,
      path: `${base || ''}/socket.io`.replace(/\/{2,}/g, '/') || '/socket.io',
    };
  } catch {
    return { url: apiBaseUrl.replace(/\/preelly-api\/?$/i, ''), path: '/socket.io' };
  }
}

const SOCKET_TARGET = resolveSocketTarget(ENV.API_BASE_URL);

let socket: Socket | null = null;
let pendingUserId: string | null = null;
let lastAuthToken: string | null = null;

/** Normalize MongoDB ids for socket rooms (must match web `user._id` strings). */
export function normalizeSocketUserId(id: unknown): string {
  if (id == null) {
    return '';
  }
  if (typeof id === 'string') {
    return id.trim();
  }
  if (typeof id === 'object') {
    const record = id as { _id?: unknown; id?: unknown; toString?: () => string };
    if (record._id != null) {
      return String(record._id).trim();
    }
    if (record.id != null) {
      return String(record.id).trim();
    }
    if (typeof record.toString === 'function') {
      return record.toString().trim();
    }
  }
  return String(id).trim();
}

function emitJoinUser(sock: Socket): void {
  const uid = normalizeSocketUserId(pendingUserId);
  if (uid) {
    sock.emit('join-user', uid);
  }
}

function wireSocketLifecycle(sock: Socket): void {
  const rejoin = () => {
    emitJoinUser(sock);
  };
  sock.off('connect', rejoin);
  sock.off('reconnect', rejoin);
  sock.on('connect', rejoin);

  if (__DEV__) {
    sock.on('connect_error', (error: Error) => {
      console.warn(
        '[ChatSocket] connect_error',
        error.message,
        SOCKET_TARGET.url,
        SOCKET_TARGET.path,
      );
    });
    sock.on('connect', () => {
      console.log('[ChatSocket] connected', sock.id, SOCKET_TARGET.url, SOCKET_TARGET.path);
    });
  }
}

function waitForConnect(sock: Socket, timeoutMs = 15000): Promise<void> {
  if (sock.connected) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sock.off('connect', onConnect);
      reject(new Error('Socket connect timeout'));
    }, timeoutMs);
    const onConnect = () => {
      clearTimeout(timer);
      resolve();
    };
    sock.once('connect', onConnect);
  });
}

export async function getChatSocket(): Promise<Socket> {
  const token = (await storage.getString(STORAGE_KEYS.ACCESS_TOKEN)) ?? null;
  const tokenChanged = token !== lastAuthToken;

  if (!socket) {
    if (__DEV__) {
      console.log(
        '[ChatSocket] connecting to',
        SOCKET_TARGET.url,
        'path=',
        SOCKET_TARGET.path,
      );
    }
    socket = io(SOCKET_TARGET.url, {
      // Same as web: mount under /preelly-api/socket.io on beta.
      path: SOCKET_TARGET.path,
      // Polling first — works when WS upgrade is blocked by proxies.
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      auth: token ? { token } : {},
    });
    attachCallSignalingListeners(socket);
    wireSocketLifecycle(socket);
    lastAuthToken = token;
  } else {
    if (token) {
      socket.auth = { token };
    }
    if (tokenChanged) {
      lastAuthToken = token;
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (!socket.connected) {
      socket.connect();
    }
  }

  try {
    await waitForConnect(socket);
  } catch {
    // Still return socket; listeners will fire after reconnect
  }

  emitJoinUser(socket);
  return socket;
}

export function setSocketUserId(userId: string): void {
  pendingUserId = normalizeSocketUserId(userId);
  if (socket?.connected) {
    emitJoinUser(socket);
  }
}

export async function ensureSocketReadyForUser(userId: string): Promise<Socket> {
  pendingUserId = normalizeSocketUserId(userId);
  const sock = await getChatSocket();
  emitJoinUser(sock);
  return sock;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  pendingUserId = null;
  lastAuthToken = null;
}

export async function joinChatRoom(threadId: string): Promise<void> {
  const id = String(threadId || '').trim();
  if (!id) {
    return;
  }
  const sock = await getChatSocket();
  sock.emit('join-room', `chat-${id}`);
}

export function leaveChatRoom(threadId: string): void {
  const id = String(threadId || '').trim();
  if (!id) {
    return;
  }
  socket?.emit('leave-room', `chat-${id}`);
}

/** Compare chat ids from socket payloads (ObjectId / string) with route threadId. */
export function socketChatIdMatches(chatId: unknown, threadId: string): boolean {
  const a = normalizeSocketUserId(chatId);
  const b = String(threadId || '').trim();
  return Boolean(a && b && a === b);
}
