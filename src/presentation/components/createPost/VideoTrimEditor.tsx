import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { OnLoadData, OnProgressData, VideoRef } from 'react-native-video';
import { VideoApi } from '../../../data/api/VideoApi';
import { VIDEO_CONSTRAINTS } from '../../../constants/createPostConstants';
import { CreatePostMediaFile } from '../../../types/createPost.types';
import { VideoFrameThumb } from '../../../types/videoFrame.types';
import { formatVideoTime } from '../../../utils/videoTime';
import { useFilmstripThumbnails } from '../../hooks/useFilmstripThumbnails';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { CP_COLORS } from './createPostStyles';

interface Props {
  video: CreatePostMediaFile;
  onCancel: () => void;
  onSave: (trimmed: CreatePostMediaFile) => void;
}

const THUMB_SIZE = 26;
const TRACK_HEIGHT = 44;
// Matches useFilmstripThumbnails' MAX_FILMSTRIP_THUMBS cap so every column gets a real thumbnail.
const FILMSTRIP_FRAME_COUNT = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildFrames = (duration: number): VideoFrameThumb[] => {
  if (duration <= 0) {
    return [];
  }
  return Array.from({ length: FILMSTRIP_FRAME_COUNT }, (_, index) => ({
    time: (duration / (FILMSTRIP_FRAME_COUNT - 1)) * index,
    uri: null,
    index,
  }));
};

export const VideoTrimEditor = memo<Props>(({ video, onCancel, onSave }) => {
  const cpStyles = useCreatePostStyles();
  const videoRef = useRef<VideoRef>(null);
  const [duration, setDuration] = useState(video.duration ?? 0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(video.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);

  const minSpan = duration > 0 ? Math.min(VIDEO_CONSTRAINTS.minTrimSeconds, duration) : 0;

  const frames = useMemo(() => buildFrames(duration), [duration]);
  const filmstrip = useFilmstripThumbnails(video.uri, frames, duration > 0);

  const trackWidth = useSharedValue(0);
  const dragStartStart = useSharedValue(0);
  const dragEndStart = useSharedValue(0);
  const activeThumb = useSharedValue<'start' | 'end' | null>(null);
  const [, setDraggingThumb] = useState<'start' | 'end' | null>(null);

  const startPercent = duration > 0 ? (start / duration) * 100 : 0;
  const endPercent = duration > 0 ? (end / duration) * 100 : 100;

  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      trackWidth.value = event.nativeEvent.layout.width;
    },
    [trackWidth],
  );

  const setDragging = useCallback((thumb: 'start' | 'end' | null) => setDraggingThumb(thumb), []);

  const updateStartFromDrag = useCallback(
    (next: number) => {
      setStart(prevStart => {
        const clamped = clamp(next, 0, end - minSpan);
        return clamped === prevStart ? prevStart : clamped;
      });
    },
    [end, minSpan],
  );

  const updateEndFromDrag = useCallback(
    (next: number) => {
      setEnd(prevEnd => {
        const clamped = clamp(next, start + minSpan, duration);
        return clamped === prevEnd ? prevEnd : clamped;
      });
    },
    [duration, start, minSpan],
  );

  const seekTo = useCallback(
    (time: number) => {
      videoRef.current?.seek(clamp(time, 0, duration));
    },
    [duration],
  );

  const startPan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          activeThumb.value = 'start';
          dragStartStart.value = start;
          runOnJS(setDragging)('start');
          runOnJS(setPaused)(true);
        })
        .onUpdate(event => {
          if (trackWidth.value <= 0 || duration <= 0) return;
          const delta = (event.translationX / trackWidth.value) * duration;
          const next = dragStartStart.value + delta;
          runOnJS(updateStartFromDrag)(next);
          runOnJS(seekTo)(next);
        })
        .onFinalize(() => {
          activeThumb.value = null;
          runOnJS(setDragging)(null);
        }),
    [activeThumb, dragStartStart, duration, seekTo, setDragging, start, trackWidth, updateStartFromDrag],
  );

  const endPan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          activeThumb.value = 'end';
          dragEndStart.value = end;
          runOnJS(setDragging)('end');
          runOnJS(setPaused)(true);
        })
        .onUpdate(event => {
          if (trackWidth.value <= 0 || duration <= 0) return;
          const delta = (event.translationX / trackWidth.value) * duration;
          const next = dragEndStart.value + delta;
          runOnJS(updateEndFromDrag)(next);
          runOnJS(seekTo)(next);
        })
        .onFinalize(() => {
          activeThumb.value = null;
          runOnJS(setDragging)(null);
        }),
    [activeThumb, dragEndStart, duration, end, seekTo, setDragging, trackWidth, updateEndFromDrag],
  );

  const startThumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeThumb.value === 'start' ? withSpring(1.1, { damping: 14 }) : withSpring(1, { damping: 14 }) }],
  }));
  const endThumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeThumb.value === 'end' ? withSpring(1.1, { damping: 14 }) : withSpring(1, { damping: 14 }) }],
  }));

  const onVideoLoad = useCallback(
    (data: OnLoadData) => {
      if (duration > 0) return;
      const loadedDuration = data.duration ?? 0;
      setDuration(loadedDuration);
      setEnd(loadedDuration);
    },
    [duration],
  );

  const onVideoProgress = useCallback(
    (data: OnProgressData) => {
      if (data.currentTime >= end) {
        seekTo(start);
      }
    },
    [end, seekTo, start],
  );

  const onSave_ = useCallback(async () => {
    if (duration <= 0 || end - start < minSpan) {
      Alert.alert('Trim too short', `Please select at least ${Math.round(minSpan)} seconds.`);
      return;
    }
    const isFullRange = start <= 0.05 && end >= duration - 0.05;
    if (isFullRange) {
      onCancel();
      return;
    }

    setSaving(true);
    try {
      const trimmed = await VideoApi.trimVideo({
        videoUri: video.uri,
        videoName: video.name,
        videoType: video.type,
        startTime: start,
        endTime: end,
      });
      onSave({
        uri: trimmed.uri,
        name: trimmed.name,
        type: trimmed.type,
        size: trimmed.size,
        duration: trimmed.duration ?? end - start,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trim video. Please try again.';
      Alert.alert('Trim failed', message);
    } finally {
      setSaving(false);
    }
  }, [duration, end, minSpan, onCancel, onSave, start, video.name, video.type, video.uri]);

  return (
    <View style={styles.wrap}>
      <View style={styles.previewWrap}>
        <Video
          ref={videoRef}
          source={{ uri: video.uri }}
          style={styles.video}
          paused={paused}
          muted={false}
          resizeMode="contain"
          onLoad={onVideoLoad}
          onProgress={onVideoProgress}
          repeat={false}
        />
        <Pressable style={styles.playOverlay} onPress={() => setPaused(prev => !prev)}>
          <View style={styles.playBtn}>
            <Icon name={paused ? 'play' : 'pause'} size={22} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatVideoTime(start)}</Text>
        <Text style={styles.timeDivider}>–</Text>
        <Text style={styles.timeText}>{formatVideoTime(end)}</Text>
        <Text style={styles.timeSpan}>({formatVideoTime(Math.max(0, end - start))})</Text>
      </View>

      <View style={styles.trackArea} onLayout={onTrackLayout}>
        <View style={styles.filmstrip}>
          {filmstrip.map(frame => (
            <View key={frame.index} style={styles.filmstripFrame}>
              {frame.uri ? (
                <Image source={{ uri: frame.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={styles.filmstripPlaceholder} />
              )}
            </View>
          ))}
        </View>

        <View style={[styles.dimMask, { left: 0, width: `${startPercent}%` }]} />
        <View style={[styles.dimMask, { left: `${endPercent}%`, right: 0 }]} />
        <View style={[styles.selectionBorder, { left: `${startPercent}%`, width: `${Math.max(endPercent - startPercent, 0)}%` }]} />

        <GestureDetector gesture={startPan}>
          <Animated.View
            style={[styles.thumb, { left: `${startPercent}%`, marginLeft: -THUMB_SIZE / 2 }, startThumbStyle]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Trim start ${formatVideoTime(start)}`}
          >
            <View style={styles.thumbGrip} />
          </Animated.View>
        </GestureDetector>

        <GestureDetector gesture={endPan}>
          <Animated.View
            style={[styles.thumb, { left: `${endPercent}%`, marginLeft: -THUMB_SIZE / 2 }, endThumbStyle]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Trim end ${formatVideoTime(end)}`}
          >
            <View style={styles.thumbGrip} />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.footerRow}>
        <Pressable style={[cpStyles.secondaryBtn, styles.footerBtn]} onPress={onCancel} disabled={saving}>
          <Text style={cpStyles.secondaryBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[cpStyles.primaryBtn, styles.footerBtn, saving ? cpStyles.primaryBtnDisabled : null]}
          onPress={onSave_}
          disabled={saving}
        >
          <Text style={cpStyles.primaryBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

VideoTrimEditor.displayName = 'VideoTrimEditor';

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  previewWrap: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9 },
  video: { flex: 1 },
  playOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  timeText: { fontSize: 15, fontWeight: '700', color: CP_COLORS.text },
  timeDivider: { fontSize: 15, color: CP_COLORS.muted },
  timeSpan: { fontSize: 13, color: CP_COLORS.muted, marginLeft: 4 },
  trackArea: {
    height: TRACK_HEIGHT,
    marginTop: 16,
  },
  filmstrip: {
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
  },
  filmstripFrame: { flex: 1, height: TRACK_HEIGHT, backgroundColor: '#0000000F' },
  filmstripPlaceholder: { flex: 1, backgroundColor: CP_COLORS.border },
  dimMask: {
    position: 'absolute',
    top: 0,
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  selectionBorder: {
    position: 'absolute',
    top: 0,
    height: TRACK_HEIGHT,
    borderWidth: 2,
    borderColor: CP_COLORS.primary,
    borderRadius: 8,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: TRACK_HEIGHT,
    borderRadius: 6,
    backgroundColor: CP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGrip: { width: 3, height: 18, borderRadius: 2, backgroundColor: '#fff' },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  footerBtn: { flex: 1 },
});
