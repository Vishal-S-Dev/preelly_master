import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video, { OnLoadData, OnProgressData, OnSeekData, VideoRef } from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { VIDEO_CONSTRAINTS } from '../../../constants/createPostConstants';
import { CreatePostImageAsset, CreatePostMediaFile } from '../../../types/createPost.types';
import { captureVideoFrame } from '../../../utils/captureVideoFrame';
import { formatVideoTime, formatVideoTimePrecise } from '../../../utils/videoTime';
import { stepFrameTime } from '../../../utils/videoFrameStep';
import { throttle } from '../../../utils/throttle';
import { useCreatePostStore } from '../../../store/createPostStore';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { useLocalVideoScrubber } from '../../hooks/useLocalVideoScrubber';
import { useFilmstripThumbnails } from '../../hooks/useFilmstripThumbnails';
import { CapturedFrame, CapturedFramesGrid } from './CapturedFramesGrid';
import { FrameScrubber } from './FrameScrubber';

interface Props {
  visible: boolean;
  video: CreatePostMediaFile | null;
  onClose: () => void;
}

const SCRUB_SEEK_MS = 48;

export const VideoFramePickerModal = memo<Props>(({ visible, video, onClose }) => {
  const insets = useStableSafeAreaInsets();
  const { images, addImages, removeImage } = useCreatePostStore();
  const videoRef = useRef<VideoRef>(null);
  const seekDoneRef = useRef<(() => void) | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [sessionCaptures, setSessionCaptures] = useState<CapturedFrame[]>([]);

  const remaining = VIDEO_CONSTRAINTS.maxImages - images.length;

  const { frames, ready: scrubberReady } = useLocalVideoScrubber({
    durationSec: duration,
    enabled: visible && !!video?.uri && duration > 0 && !videoError,
  });

  const filmstripFrames = useFilmstripThumbnails(
    video?.uri,
    frames,
    visible && scrubberReady && !videoError,
  );

  const throttledSeek = useMemo(
    () =>
      throttle((time: number) => {
        const clamped = Math.max(0, Math.min(duration || time, time));
        videoRef.current?.seek(clamped);
      }, SCRUB_SEEK_MS),
    [duration],
  );

  useEffect(() => {
    if (!visible) {
      setCurrentTime(0);
      setDuration(0);
      setPaused(true);
      setIsScrubbing(false);
      setVideoError(null);
      setSessionCaptures([]);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && video && !video.uri?.trim()) {
      setVideoError('Invalid video file. Please upload again.');
    }
  }, [visible, video]);

  const onLoad = useCallback((meta: OnLoadData) => {
    const d = meta.duration || 0;
    if (d <= 0) {
      setVideoError('Could not read video duration.');
      return;
    }
    setDuration(d);
    setCurrentTime(0);
    setVideoError(null);
  }, []);

  const onProgress = useCallback(
    (p: OnProgressData) => {
      if (!isScrubbing) {
        setCurrentTime(p.currentTime);
      }
    },
    [isScrubbing],
  );

  const onSeek = useCallback((data: OnSeekData) => {
    setCurrentTime(data.currentTime);
    seekDoneRef.current?.();
    seekDoneRef.current = null;
  }, []);

  const waitForSeek = useCallback((timeSec: number) => {
    return new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        seekDoneRef.current = null;
        resolve();
      }, 600);
      seekDoneRef.current = () => {
        clearTimeout(timer);
        resolve();
      };
      videoRef.current?.seek(timeSec);
    });
  }, []);

  const seekTo = useCallback(
    (timeSec: number, options?: { throttle?: boolean }) => {
      const clamped = Math.max(0, Math.min(duration || timeSec, timeSec));
      setCurrentTime(clamped);
      if (options?.throttle) {
        throttledSeek(clamped);
      } else {
        videoRef.current?.seek(clamped);
      }
    },
    [duration, throttledSeek],
  );

  const onScrub = useCallback(
    (timeSec: number) => {
      setIsScrubbing(true);
      setPaused(true);
      seekTo(timeSec, { throttle: true });
    },
    [seekTo],
  );

  const onScrubEnd = useCallback(
    (timeSec: number) => {
      seekTo(timeSec);
      setIsScrubbing(false);
    },
    [seekTo],
  );

  const togglePlay = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const stepFrame = useCallback(
    (direction: -1 | 1) => {
      if (!duration) return;
      setPaused(true);
      const next = stepFrameTime(currentTime, direction, duration);
      seekTo(next);
    },
    [currentTime, duration, seekTo],
  );

  const handleCapture = useCallback(async () => {
    if (!video?.uri) {
      Alert.alert('Error', 'No video available.');
      return;
    }
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${VIDEO_CONSTRAINTS.maxImages} photos allowed.`);
      return;
    }

    setCapturing(true);
    setPaused(true);

    try {
      const captureTime = Math.max(0, currentTime);
      await waitForSeek(captureTime);
      await new Promise<void>(resolve => setTimeout(resolve, 120));

      const uri = await captureVideoFrame(video, captureTime);
      if (!uri) {
        Alert.alert(
          'Capture failed',
          'Could not extract this frame. Check your connection and try scrubbing to a different moment.',
        );
        return;
      }

      const asset: CapturedFrame = {
        id: `frame_${Date.now()}_${Math.round(currentTime * 1000)}`,
        uri,
        fromVideo: true,
        capturedAtSec: currentTime,
      };
      addImages([asset]);
      setSessionCaptures(prev => [...prev, asset]);
    } finally {
      setCapturing(false);
    }
  }, [addImages, currentTime, remaining, video, waitForSeek]);

  const handleRemoveCapture = useCallback(
    (id: string) => {
      setSessionCaptures(prev => prev.filter(frame => frame.id !== id));
      removeImage(id);
    },
    [removeImage],
  );

  const handleClearAllCaptures = useCallback(() => {
    if (!sessionCaptures.length) return;
    Alert.alert('Clear all captures?', 'This removes every screenshot captured in this session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          sessionCaptures.forEach(frame => removeImage(frame.id));
          setSessionCaptures([]);
        },
      },
    ]);
  }, [removeImage, sessionCaptures]);

  if (!video) return null;

  const canCapture = !capturing && !videoError && remaining > 0 && scrubberReady;
  const canStep = !videoError && duration > 0 && (paused || isScrubbing);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.topTitle}>Screen Grab</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Done">
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        {videoError ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={40} color="#FF453A" />
            <Text style={styles.errorText}>{videoError}</Text>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Pressable style={styles.player} onPress={togglePlay}>
                <Video
                  ref={videoRef}
                  source={{ uri: video.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  paused={paused || isScrubbing}
                  onLoad={onLoad}
                  onProgress={onProgress}
                  onSeek={onSeek}
                  progressUpdateInterval={50}
                  onError={() => setVideoError('Video playback failed. The file may be corrupted.')}
                />
                {paused || isScrubbing ? (
                  <View style={styles.playOverlay} pointerEvents="none">
                    <Icon name="play" size={44} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.timeRow}>
                <Text style={styles.preciseTime}>{formatVideoTimePrecise(currentTime)}</Text>
                <Text style={styles.timeDivider}> / </Text>
                <Text style={styles.durationTime}>{formatVideoTime(duration)}</Text>
              </View>

              <View style={styles.frameControls}>
                <Pressable
                  style={[styles.frameBtn, !canStep && styles.frameBtnDisabled]}
                  disabled={!canStep}
                  onPress={() => stepFrame(-1)}
                  accessibilityLabel="Previous frame">
                  <Icon name="chevron-left" size={22} color="#FFFFFF" />
                  <Text style={styles.frameBtnText}>Frame</Text>
                </Pressable>

                <Pressable style={styles.playToggleBtn} onPress={togglePlay} accessibilityLabel="Play or pause">
                  <Icon name={paused ? 'play' : 'pause'} size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={[styles.frameBtn, !canStep && styles.frameBtnDisabled]}
                  disabled={!canStep}
                  onPress={() => stepFrame(1)}
                  accessibilityLabel="Next frame">
                  <Text style={styles.frameBtnText}>Frame</Text>
                  <Icon name="chevron-right" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              {scrubberReady ? (
                <FrameScrubber
                  frames={filmstripFrames}
                  durationSec={duration}
                  currentTimeSec={currentTime}
                  onScrub={onScrub}
                  onScrubEnd={onScrubEnd}
                  isScrubbing={isScrubbing}
                  followTimeline={paused || isScrubbing}
                  formatTime={formatVideoTimePrecise}
                />
              ) : (
                <View style={styles.scrubberLoading}>
                  <ActivityIndicator color="#3B82F6" />
                  <Text style={styles.scrubberLoadingText}>Preparing timeline…</Text>
                </View>
              )}

              <View style={styles.capturesSection}>
                <CapturedFramesGrid
                  frames={sessionCaptures}
                  onRemove={handleRemoveCapture}
                  onClearAll={handleClearAllCaptures}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.remaining}>
                Photos: {images.length}/{VIDEO_CONSTRAINTS.maxImages} · Session: {sessionCaptures.length} captured
              </Text>

              <Pressable
                style={[styles.captureBtn, !canCapture && styles.captureBtnDisabled]}
                disabled={!canCapture}
                onPress={handleCapture}>
                {capturing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureBtnInner}>
                    <Icon name="camera" size={20} color="#fff" />
                    <Text style={styles.captureText}>Capture Screenshot</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
});

VideoFramePickerModal.displayName = 'VideoFramePickerModal';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  doneText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  player: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  preciseTime: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeDivider: {
    color: '#52525B',
    fontSize: 16,
    fontWeight: '600',
  },
  durationTime: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  frameControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  frameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  frameBtnDisabled: {
    opacity: 0.35,
  },
  frameBtnText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '700',
  },
  playToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  scrubberLoading: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scrubberLoadingText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  capturesSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A0A0B',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: '#FF453A',
    textAlign: 'center',
    fontSize: 15,
  },
  remaining: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  captureBtn: {
    backgroundColor: '#0066CC',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.4,
  },
  captureBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
