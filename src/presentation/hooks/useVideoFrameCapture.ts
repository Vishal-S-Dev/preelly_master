import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OnLoadData, OnProgressData, OnSeekData, VideoRef } from 'react-native-video';
import { VIDEO_CONSTRAINTS } from '../../constants/createPostConstants';
import { CreatePostMediaFile } from '../../types/createPost.types';
import { VideoFrameThumb } from '../../types/videoFrame.types';
import { captureVideoFrame } from '../../utils/captureVideoFrame';
import { captureVideoFrameLocally, resolveVideoUriForFrameCapture } from '../../utils/localVideoFrameCapture';
import { throttle } from '../../utils/throttle';
import { videoFrameCache } from '../../utils/videoFrameCache';
import { buildScrubberFrames } from '../../utils/videoFrameThumbnails';

const SCRUB_SEEK_MS = 48;
const THUMB_BATCH_SIZE = 4;
const THUMB_GEN_DELAY_MS = 280;

interface Options {
  video: CreatePostMediaFile | null;
  visible: boolean;
  imageCount: number;
  /** Allows capture when the photo grid is full (replace-image flow). */
  allowCaptureAtLimit?: boolean;
}

export const useVideoFrameCapture = ({
  video,
  visible,
  imageCount,
  allowCaptureAtLimit = false,
}: Options) => {
  const videoRef = useRef<VideoRef>(null);
  const seekDoneRef = useRef<(() => void) | null>(null);
  const framesRef = useRef<VideoFrameThumb[]>([]);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [frames, setFrames] = useState<VideoFrameThumb[]>([]);
  const [thumbUriByIndex, setThumbUriByIndex] = useState<Record<number, string>>({});
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);

  const remaining = VIDEO_CONSTRAINTS.maxImages - imageCount;
  const scrubberReady = visible && !!video?.uri && duration > 0 && !videoError;
  const canCapture = scrubberReady && !capturing && (allowCaptureAtLimit || remaining > 0);

  framesRef.current = frames;

  const throttledSeek = useMemo(
    () =>
      throttle((time: number) => {
        const clamped = Math.max(0, Math.min(duration || time, time));
        videoRef.current?.seek(clamped);
      }, SCRUB_SEEK_MS),
    [duration],
  );

  const reset = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsScrubbing(false);
    setVideoError(null);
    setFrames([]);
    setThumbUriByIndex({});
    setThumbnailsLoading(false);
    videoFrameCache.clear();
  }, []);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [reset, visible]);

  useEffect(() => {
    if (visible && video && !video.uri?.trim()) {
      setVideoError('Invalid video file. Please upload again.');
    }
  }, [visible, video]);

  useEffect(() => {
    if (!scrubberReady) {
      setFrames([]);
      return;
    }
    setFrames(buildScrubberFrames(duration));
  }, [duration, scrubberReady]);

  useEffect(() => {
    if (!scrubberReady || !video?.uri || frames.length === 0) {
      return;
    }

    let cancelled = false;
    const snapshot = frames;

    const generateThumbnails = async () => {
      if (!video?.uri) {
        return;
      }

      setThumbnailsLoading(true);
      const videoUri = await resolveVideoUriForFrameCapture(video.uri);
      await new Promise<void>(resolve => setTimeout(resolve, THUMB_GEN_DELAY_MS));
      if (cancelled) return;

      let batch: Record<number, string> = {};

      for (let i = 0; i < snapshot.length; i += 1) {
        if (cancelled) break;

        const frame = snapshot[i];
        const cached = videoFrameCache.get(videoUri, frame.time);
        if (cached) {
          batch[i] = cached;
        } else {
          const uri = await captureVideoFrameLocally(videoUri, frame.time, {
            maxWidth: 160,
            maxHeight: 96,
            persist: false,
          });
          if (uri) {
            videoFrameCache.set(videoUri, frame.time, uri);
            batch[i] = uri;
          }
        }

        const isBatchEnd = (i + 1) % THUMB_BATCH_SIZE === 0 || i === snapshot.length - 1;
        if (isBatchEnd && Object.keys(batch).length > 0) {
          const flush = batch;
          batch = {};
          setThumbUriByIndex(prev => ({ ...prev, ...flush }));
        }
      }

      if (!cancelled) {
        setThumbnailsLoading(false);
      }
    };

    generateThumbnails();

    return () => {
      cancelled = true;
    };
  }, [frames, scrubberReady, video?.uri]);

  const enrichedFrames = useMemo(
    () =>
      frames.map(frame => ({
        ...frame,
        uri: thumbUriByIndex[frame.index] ?? frame.uri,
      })),
    [frames, thumbUriByIndex],
  );

  const getThumbnailUri = useCallback(
    (timeSec: number): string | null => {
      if (!video?.uri) return null;
      const cached = videoFrameCache.get(video.uri, timeSec);
      if (cached) return cached;

      const index = framesRef.current.findIndex(
        frame => Math.abs(frame.time - timeSec) < 0.05,
      );
      if (index >= 0 && thumbUriByIndex[index]) {
        return thumbUriByIndex[index];
      }
      return null;
    },
    [thumbUriByIndex, video?.uri],
  );

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
    (progress: OnProgressData) => {
      if (!isScrubbing) {
        setCurrentTime(progress.currentTime);
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

  const captureFrame = useCallback(async (): Promise<string | null> => {
    if (!video?.uri || (!allowCaptureAtLimit && remaining <= 0)) {
      return null;
    }

    setCapturing(true);

    try {
      const captureTime = Math.max(0, currentTime);
      await waitForSeek(captureTime);
      const settleMs = /^https?:\/\//i.test(video.uri.trim()) ? 220 : 120;
      await new Promise<void>(resolve => setTimeout(resolve, settleMs));
      return await captureVideoFrame(video, captureTime);
    } finally {
      setCapturing(false);
    }
  }, [allowCaptureAtLimit, currentTime, remaining, video, waitForSeek]);

  const onVideoError = useCallback(() => {
    setVideoError('Video playback failed. The file may be corrupted.');
  }, []);

  return {
    videoRef,
    duration,
    currentTime,
    isScrubbing,
    capturing,
    videoError,
    frames: enrichedFrames,
    remaining,
    scrubberReady,
    thumbnailsLoading,
    canCapture,
    onLoad,
    onProgress,
    onSeek,
    onScrub,
    onScrubEnd,
    onVideoError,
    captureFrame,
    getThumbnailUri,
  };
};
