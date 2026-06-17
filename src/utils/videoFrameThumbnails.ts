import { VideoFrameThumb } from '../types/videoFrame.types';

export const FRAME_TIMELINE_MAX_FRAMES = 24;
export const SCRUBBER_SEGMENT_COUNT_SHORT = 16;

/** Adaptive segment count for the filmstrip scrubber (time markers only — no image extraction). */
export const getTimelineConfig = (durationSec: number): { segmentCount: number } => {
  if (durationSec <= 0) {
    return { segmentCount: 1 };
  }
  if (durationSec <= 60) {
    return { segmentCount: Math.min(SCRUBBER_SEGMENT_COUNT_SHORT, Math.max(10, Math.ceil(durationSec / 2))) };
  }
  if (durationSec <= 180) {
    return { segmentCount: FRAME_TIMELINE_MAX_FRAMES };
  }
  return { segmentCount: FRAME_TIMELINE_MAX_FRAMES };
};

export const buildTimelineTimestamps = (durationSec: number): number[] => {
  const { segmentCount } = getTimelineConfig(durationSec);
  if (durationSec <= 0) return [0];

  const count = Math.min(segmentCount, Math.max(2, segmentCount));
  const step = durationSec / Math.max(count - 1, 1);

  return Array.from({ length: count }, (_, i) => {
    if (i === count - 1) return durationSec;
    return Math.min(durationSec, Math.round(i * step * 10) / 10);
  });
};

/** Filmstrip markers for scrubbing — no URIs until user captures. */
export const buildScrubberFrames = (durationSec: number): VideoFrameThumb[] =>
  buildTimelineTimestamps(durationSec).map((time, index) => ({
    time,
    uri: null,
    index,
  }));

export const timeAtScrollIndex = (frames: VideoFrameThumb[], index: number): number =>
  frames[Math.max(0, Math.min(frames.length - 1, index))]?.time ?? 0;

export const indexAtTime = (frames: VideoFrameThumb[], timeSec: number): number => {
  if (!frames.length) return 0;
  let best = 0;
  let bestDelta = Math.abs(frames[0].time - timeSec);
  frames.forEach((frame, i) => {
    const delta = Math.abs(frame.time - timeSec);
    if (delta < bestDelta) {
      best = i;
      bestDelta = delta;
    }
  });
  return best;
};
