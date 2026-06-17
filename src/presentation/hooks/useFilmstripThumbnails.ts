import { useEffect, useMemo, useRef, useState } from 'react';
import { captureVideoFrameLocally } from '../../utils/localVideoFrameCapture';
import { VideoFrameThumb } from '../../types/videoFrame.types';

const MAX_FILMSTRIP_THUMBS = 8;
const LOAD_DELAY_MS = 500;
const BATCH_SIZE = 4;

const pickThumbnailIndices = (count: number, max: number): number[] => {
  if (count <= 0) return [];
  if (count <= max) {
    return Array.from({ length: count }, (_, i) => i);
  }
  const step = (count - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => Math.round(i * step));
};

/**
 * Lazily enriches filmstrip markers with thumbnails — batched to avoid list thrashing.
 */
export const useFilmstripThumbnails = (
  videoUri: string | undefined,
  frames: VideoFrameThumb[],
  enabled: boolean,
): VideoFrameThumb[] => {
  const [uriByIndex, setUriByIndex] = useState<Record<number, string>>({});
  const framesRef = useRef(frames);
  framesRef.current = frames;

  const frameCount = frames.length;
  const frameTimesKey = useMemo(
    () => frames.map(frame => frame.time).join(','),
    [frames],
  );

  useEffect(() => {
    if (!enabled || !videoUri?.trim() || frameCount === 0) {
      setUriByIndex({});
      return;
    }

    let cancelled = false;
    const indices = pickThumbnailIndices(frameCount, MAX_FILMSTRIP_THUMBS);
    const snapshot = framesRef.current;

    const load = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, LOAD_DELAY_MS));
      if (cancelled) return;

      let batch: Record<number, string> = {};

      for (let i = 0; i < indices.length; i += 1) {
        if (cancelled) break;
        const index = indices[i];
        const time = snapshot[index]?.time ?? 0;
        const uri = await captureVideoFrameLocally(videoUri, time, {
          maxWidth: 112,
          maxHeight: 64,
          persist: false,
        });
        if (cancelled || !uri) continue;
        batch[index] = uri;

        const isBatchEnd = (i + 1) % BATCH_SIZE === 0 || i === indices.length - 1;
        if (isBatchEnd) {
          const flush = batch;
          batch = {};
          setUriByIndex(prev => ({ ...prev, ...flush }));
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, frameCount, frameTimesKey, videoUri]);

  return useMemo(
    () =>
      frames.map(frame => ({
        ...frame,
        uri: uriByIndex[frame.index] ?? frame.uri,
      })),
    [frames, uriByIndex],
  );
};
