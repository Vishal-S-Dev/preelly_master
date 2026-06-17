import { useCallback, useRef, useState } from 'react';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function useWebRTC() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const getLocalMedia = useCallback(async (withVideo = true) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: withVideo ? { facingMode: 'user' } : false,
    });
    setLocalStream(stream);
    setIsVideoOff(!withVideo);
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    (stream: MediaStream, onIceCandidate: (candidate: RTCIceCandidate) => void) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onicecandidate = event => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };

      pc.ontrack = event => {
        if (event.streams?.[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      return pc;
    },
    [],
  );

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) {
      throw new Error('Peer connection not ready');
    }
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    return offer;
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) {
      throw new Error('Peer connection not ready');
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, []);

  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) {
      throw new Error('Peer connection not ready');
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc) {
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // ignore
    }
  }, []);

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsMuted(m => !m);
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsVideoOff(v => !v);
  }, [localStream]);

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop());
    remoteStream?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [localStream, remoteStream]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    getLocalMedia,
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    toggleMute,
    toggleVideo,
    cleanup,
  };
}
