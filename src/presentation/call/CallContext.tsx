import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ChatApi } from '../../data/api/ChatApi';
import {
  CallSignalingPayload,
  clearCallSignalingHandlers,
  setCallSignalingHandlers,
} from '../../data/network/callSignaling';
import {
  disconnectChatSocket,
  ensureSocketReadyForUser,
  getChatSocket,
  normalizeSocketUserId,
} from '../../data/network/chatSocket';
import { useAppSelector } from '../hooks/useRedux';
import { CallModal } from './CallModal';
import { useWebRTC } from './useWebRTC';

type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';
type CallType = 'video' | 'audio';

interface RemoteUser {
  id: string;
  name: string;
}

interface CallContextValue {
  startCall: (target: RemoteUser, type?: CallType, threadId?: string | null) => void;
  callState: CallState;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

function hasValidOffer(offer: unknown): offer is RTCSessionDescriptionInit {
  if (!offer || typeof offer !== 'object') {
    return false;
  }
  const o = offer as RTCSessionDescriptionInit;
  return Boolean(o.type && (o.sdp || o.type === 'offer' || o.type === 'answer'));
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const isGuest = useAppSelector(s => s.auth.isGuest);
  const user = useAppSelector(s => s.auth.user);
  const rtc = useWebRTC();
  const rtcRef = useRef(rtc);
  rtcRef.current = rtc;

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [remoteUser, setRemoteUser] = useState<RemoteUser | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const callStateRef = useRef(callState);
  const remoteUserRef = useRef(remoteUser);
  const threadIdRef = useRef(threadId);
  const callTypeRef = useRef(callType);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callStartTimeRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);
  useEffect(() => {
    remoteUserRef.current = remoteUser;
  }, [remoteUser]);
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);
  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);
  useEffect(() => {
    if (callState === 'active') {
      callStartTimeRef.current = Date.now();
    }
  }, [callState]);

  const saveEvent = useCallback((status: string) => {
    const tId = threadIdRef.current;
    if (!tId) {
      return;
    }
    const duration = callStartTimeRef.current
      ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
      : 0;
    ChatApi.saveCallEvent(tId, {
      callType: callTypeRef.current,
      status,
      duration,
    }).catch(() => undefined);
  }, []);

  const resetState = useCallback(() => {
    rtcRef.current.cleanup();
    setCallState('idle');
    setRemoteUser(null);
    setThreadId(null);
    incomingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    callStartTimeRef.current = null;
  }, []);

  const handleIncoming = useCallback(
    async (data: CallSignalingPayload) => {
      const from = normalizeSocketUserId(data.from);
      const offer = data.offer;

      if (!from) {
        return;
      }
      if (!hasValidOffer(offer)) {
        console.warn('[Call] call:incoming missing valid offer', data);
        return;
      }

      if (callStateRef.current !== 'idle') {
        const socket = await getChatSocket();
        socket.emit('call:reject', { to: from, threadId: data.threadId });
        return;
      }

      incomingOfferRef.current = offer;
      pendingCandidatesRef.current = [];
      const callT: CallType = data.type === 'video' ? 'video' : 'audio';
      setCallType(callT);
      setRemoteUser({ id: from, name: data.fromName || 'Unknown' });
      setThreadId(data.threadId ?? null);
      setCallState('incoming');
    },
    [],
  );

  const handleAnswered = useCallback(async (data: CallSignalingPayload) => {
    const answer = data.answer;
    if (!hasValidOffer(answer)) {
      return;
    }
    try {
      await rtcRef.current.setRemoteAnswer(answer);
      setCallState('active');
      for (const c of pendingCandidatesRef.current) {
        await rtcRef.current.addIceCandidate(c);
      }
      pendingCandidatesRef.current = [];
    } catch (e) {
      console.warn('setRemoteAnswer', e);
    }
  }, []);

  const handleIce = useCallback(async (data: CallSignalingPayload) => {
    const candidate = data.candidate;
    if (!candidate) {
      return;
    }
    if (callStateRef.current === 'active') {
      await rtcRef.current.addIceCandidate(candidate);
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  const handleEnd = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleRejected = useCallback(() => {
    saveEvent('cancelled');
    resetState();
  }, [resetState, saveEvent]);

  // Register handlers immediately (socket listeners are permanent in chatSocket.ts).
  useEffect(() => {
    setCallSignalingHandlers({
      onIncoming: handleIncoming,
      onAnswered: handleAnswered,
      onIceCandidate: handleIce,
      onEnd: handleEnd,
      onRejected: handleRejected,
    });
    return () => clearCallSignalingHandlers();
  }, [handleIncoming, handleAnswered, handleIce, handleEnd, handleRejected]);

  // Join user room whenever logged in (web targets `user-${to}`).
  useEffect(() => {
    const uid = normalizeSocketUserId(user?.id);
    if (!isAuthenticated || isGuest || !uid) {
      userIdRef.current = null;
      disconnectChatSocket();
      return;
    }

    userIdRef.current = uid;
    ensureSocketReadyForUser(uid).catch(err => {
      console.warn('[Call] ensureSocketReadyForUser', err);
    });

    return undefined;
  }, [isAuthenticated, isGuest, user?.id]);

  // Re-join user room when app returns to foreground.
  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      const uid = userIdRef.current;
      if (next === 'active' && uid) {
        ensureSocketReadyForUser(uid).catch(() => undefined);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, []);

  const startCall = useCallback(
    async (target: RemoteUser, type: CallType = 'audio', tId: string | null = null) => {
      const toId = normalizeSocketUserId(target?.id);
      if (callStateRef.current !== 'idle' || !toId) {
        return;
      }
      const socket = await getChatSocket();
      setCallType(type);
      setRemoteUser({ id: toId, name: target.name });
      setThreadId(tId);
      setCallState('outgoing');
      pendingCandidatesRef.current = [];

      try {
        const stream = await rtcRef.current.getLocalMedia(type === 'video');
        rtcRef.current.createPeerConnection(stream, candidate => {
          socket.emit('call:ice-candidate', { to: toId, candidate });
        });
        const offer = await rtcRef.current.createOffer();
        socket.emit('call:offer', {
          to: toId,
          threadId: tId,
          type,
          offer,
          callerName: user?.name || 'User',
        });
      } catch (e) {
        console.warn('startCall', e);
        resetState();
      }
    },
    [user?.name, resetState],
  );

  const acceptCall = useCallback(async () => {
    const offer = incomingOfferRef.current;
    const remote = remoteUserRef.current;
    const tId = threadIdRef.current;
    const type = callTypeRef.current;
    if (!offer || !remote?.id) {
      return;
    }
    const socket = await getChatSocket();
    try {
      const stream = await rtcRef.current.getLocalMedia(type === 'video');
      rtcRef.current.createPeerConnection(stream, candidate => {
        socket.emit('call:ice-candidate', { to: remote.id, candidate });
      });
      const answer = await rtcRef.current.createAnswer(offer);
      socket.emit('call:answer', { to: remote.id, threadId: tId, answer });
      setCallState('active');
      incomingOfferRef.current = null;
      for (const c of pendingCandidatesRef.current) {
        await rtcRef.current.addIceCandidate(c);
      }
      pendingCandidatesRef.current = [];
    } catch (e) {
      console.warn('acceptCall', e);
      resetState();
    }
  }, [resetState]);

  const endCall = useCallback(async () => {
    const socket = await getChatSocket();
    const remote = remoteUserRef.current;
    const tId = threadIdRef.current;
    const state = callStateRef.current;
    if (remote?.id) {
      socket.emit('call:end', { to: remote.id, threadId: tId });
    }
    const status = state === 'active' ? 'completed' : 'missed';
    saveEvent(status);
    resetState();
  }, [resetState, saveEvent]);

  const rejectCall = useCallback(async () => {
    const socket = await getChatSocket();
    const remote = remoteUserRef.current;
    const tId = threadIdRef.current;
    if (remote?.id) {
      socket.emit('call:reject', { to: remote.id, threadId: tId });
    }
    saveEvent('rejected');
    resetState();
  }, [resetState, saveEvent]);

  const value = useMemo(
    () => ({ startCall, callState }),
    [startCall, callState],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallModal
        callState={callState}
        callType={callType}
        remoteUser={remoteUser}
        localStream={rtc.localStream}
        remoteStream={rtc.remoteStream}
        isMuted={rtc.isMuted}
        isVideoOff={rtc.isVideoOff}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={rtc.toggleMute}
        onToggleVideo={rtc.toggleVideo}
      />
    </CallContext.Provider>
  );
};

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within CallProvider');
  }
  return ctx;
}
