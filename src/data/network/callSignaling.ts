import type { Socket } from 'socket.io-client';

export type CallSignalingPayload = {
  from?: string;
  fromName?: string;
  threadId?: string;
  type?: 'video' | 'audio';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export type CallSignalingHandlers = {
  onIncoming?: (data: CallSignalingPayload) => void;
  onAnswered?: (data: CallSignalingPayload) => void;
  onIceCandidate?: (data: CallSignalingPayload) => void;
  onEnd?: (data: CallSignalingPayload) => void;
  onRejected?: (data: CallSignalingPayload) => void;
};

let handlers: CallSignalingHandlers = {};

export function setCallSignalingHandlers(next: CallSignalingHandlers): void {
  handlers = next;
}

export function clearCallSignalingHandlers(): void {
  handlers = {};
}

const SOCKET_FLAG = '__preellyCallListenersAttached';

/** Attach once per socket instance — never removed on React re-renders. */
export function attachCallSignalingListeners(socket: Socket): void {
  const flagged = socket as Socket & { [SOCKET_FLAG]?: boolean };
  if (flagged[SOCKET_FLAG]) {
    return;
  }
  flagged[SOCKET_FLAG] = true;

  socket.on('call:incoming', (data: CallSignalingPayload) => {
    handlers.onIncoming?.(data);
  });
  socket.on('call:answered', (data: CallSignalingPayload) => {
    handlers.onAnswered?.(data);
  });
  socket.on('call:ice-candidate', (data: CallSignalingPayload) => {
    handlers.onIceCandidate?.(data);
  });
  socket.on('call:end', (data: CallSignalingPayload) => {
    handlers.onEnd?.(data);
  });
  socket.on('call:rejected', (data: CallSignalingPayload) => {
    handlers.onRejected?.(data);
  });
}
