import { io, Socket } from 'socket.io-client';
import { ENV } from '../../constants/env';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { storage } from '../../utils/storage';
import { attachCallSignalingListeners } from './callSignaling';

const SOCKET_BASE = ENV.API_BASE_URL.replace(/\/api\/?$/i, '');

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
  sock.on('reconnect', rejoin);
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
    socket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling'],
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

export function joinChatRoom(threadId: string): void {
  socket?.emit('join-room', `chat-${threadId}`);
}

export function leaveChatRoom(threadId: string): void {
  socket?.emit('leave-room', `chat-${threadId}`);
}
