import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';
type CallType = 'video' | 'audio';

interface RemoteUser {
  id: string;
  name: string;
}

interface Props {
  callState: CallState;
  callType: CallType;
  remoteUser: RemoteUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

const GRADIENT_BG = '#1e1b4b';

const Avatar: React.FC<{ name?: string; size?: number }> = ({ name, size = 96 }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {(name?.[0] ?? '?').toUpperCase()}
    </Text>
  </View>
);

const CallActionBtn: React.FC<{
  onPress: () => void;
  label: string;
  color: 'green' | 'red' | 'ghost';
  icon: string;
}> = ({ onPress, label, color, icon }) => (
  <Pressable onPress={onPress} style={styles.actionWrap}>
    <View
      style={[
        styles.actionCircle,
        color === 'green' && styles.actionGreen,
        color === 'red' && styles.actionRed,
        color === 'ghost' && styles.actionGhost,
      ]}>
      <Icon name={icon} size={26} color="#fff" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
);

/** Mirrors web IncomingScreen */
const IncomingScreen: React.FC<{
  remoteUser: RemoteUser | null;
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}> = ({ remoteUser, callType, onAccept, onReject }) => (
  <View style={styles.screenBody}>
    <View style={styles.screenTop}>
      <View style={styles.pulseWrap}>
        <View style={styles.pulseRingOuter} />
        <View style={styles.pulseRingInner} />
        <Avatar name={remoteUser?.name} size={96} />
      </View>
      <Text style={styles.titleName}>{remoteUser?.name || 'Unknown'}</Text>
      <Text style={styles.subtitle}>
        Incoming {callType === 'video' ? 'video' : 'voice'} call…
      </Text>
    </View>
    <View style={styles.screenBottom}>
      <CallActionBtn onPress={onReject} label="Decline" color="red" icon="phone-hangup" />
      <CallActionBtn onPress={onAccept} label="Accept" color="green" icon="phone" />
    </View>
  </View>
);

/** Mirrors web OutgoingScreen */
const OutgoingScreen: React.FC<{
  remoteUser: RemoteUser | null;
  callType: CallType;
  onEnd: () => void;
}> = ({ remoteUser, callType, onEnd }) => (
  <View style={styles.screenBody}>
    <View style={styles.screenTop}>
      <View style={styles.pulseWrap}>
        <View style={styles.pulseRingOuter} />
        <Avatar name={remoteUser?.name} size={96} />
      </View>
      <Text style={styles.titleName}>{remoteUser?.name || 'Unknown'}</Text>
      <Text style={styles.subtitle}>
        {callType === 'video' ? 'Video calling…' : 'Calling…'}
      </Text>
    </View>
    <View style={styles.screenBottom}>
      <CallActionBtn onPress={onEnd} label="End" color="red" icon="phone-hangup" />
    </View>
  </View>
);

/** Mirrors web ActiveScreen */
const ActiveScreen: React.FC<{
  remoteUser: RemoteUser | null;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}> = ({
  remoteUser,
  callType,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onEnd,
  onToggleMute,
  onToggleVideo,
}) => {
  const hasVideo = callType === 'video';
  const showRemoteVideo = hasVideo && remoteStream;

  return (
    <View style={styles.activeRoot}>
      <View style={styles.activeVideoArea}>
        {showRemoteVideo ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
          />
        ) : (
          <View style={styles.activeAvatarCenter}>
            <Avatar name={remoteUser?.name} size={88} />
            <Text style={styles.titleName}>{remoteUser?.name}</Text>
            <Text style={styles.subtitle}>
              {hasVideo ? 'Camera off' : 'Voice call connected'}
            </Text>
          </View>
        )}
        <View style={styles.nameBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeName}>{remoteUser?.name}</Text>
        </View>
        {hasVideo && localStream && !isVideoOff ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localPreview}
            objectFit="cover"
            mirror
          />
        ) : null}
      </View>
      <View style={styles.activeControls}>
        <CallActionBtn
          onPress={onToggleMute}
          label={isMuted ? 'Unmute' : 'Mute'}
          color="ghost"
          icon={isMuted ? 'microphone-off' : 'microphone'}
        />
        {hasVideo ? (
          <CallActionBtn
            onPress={onToggleVideo}
            label={isVideoOff ? 'Cam on' : 'Cam off'}
            color="ghost"
            icon={isVideoOff ? 'video-off' : 'video'}
          />
        ) : null}
        <CallActionBtn onPress={onEnd} label="End call" color="red" icon="phone-hangup" />
      </View>
    </View>
  );
};

export const CallModal: React.FC<Props> = ({
  callState,
  callType,
  remoteUser,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
}) => (
  <Modal
    visible={callState !== 'idle'}
    animationType="slide"
    presentationStyle="fullScreen"
    statusBarTranslucent>
    <View style={styles.modalRoot}>
      {callState === 'incoming' && (
        <IncomingScreen
          remoteUser={remoteUser}
          callType={callType}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
      {callState === 'outgoing' && (
        <OutgoingScreen remoteUser={remoteUser} callType={callType} onEnd={onEnd} />
      )}
      {callState === 'active' && (
        <ActiveScreen
          remoteUser={remoteUser}
          callType={callType}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onEnd={onEnd}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
        />
      )}
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: GRADIENT_BG,
  },
  screenBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  screenTop: {
    alignItems: 'center',
    paddingTop: 32,
  },
  screenBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 48,
    paddingBottom: 24,
  },
  pulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(139,92,246,0.3)',
  },
  avatar: {
    backgroundColor: 'rgba(124,58,237,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: '#fff',
  },
  titleName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  actionWrap: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGreen: {
    backgroundColor: '#22C55E',
  },
  actionRed: {
    backgroundColor: '#EF4444',
  },
  actionGhost: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  activeRoot: {
    flex: 1,
  },
  activeVideoArea: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAvatarCenter: {
    alignItems: 'center',
    gap: 12,
  },
  nameBadge: {
    position: 'absolute',
    top: 56,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  badgeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  localPreview: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});
