export const DEFAULT_VIDEO_FPS = 30;

/** Duration of one frame in seconds. */
export const getFrameStepSec = (fps = DEFAULT_VIDEO_FPS): number => 1 / fps;

/** Step current playback time by one frame (video should be paused). */
export const stepFrameTime = (
  currentSec: number,
  direction: -1 | 1,
  durationSec: number,
  fps = DEFAULT_VIDEO_FPS,
): number => {
  const step = getFrameStepSec(fps);
  const next = currentSec + direction * step;
  return Math.max(0, Math.min(durationSec, Number(next.toFixed(4))));
};
