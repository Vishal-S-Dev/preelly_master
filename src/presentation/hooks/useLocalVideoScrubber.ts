import { useEffect, useMemo, useState } from 'react';
import { buildScrubberFrames } from '../../utils/videoFrameThumbnails';
import { VideoFrameThumb } from '../../types/videoFrame.types';

interface Options {
  durationSec: number;
  enabled: boolean;
}

/**
 * Builds time-based filmstrip markers for local scrubbing.
 * No network / no frame extraction — preview is the video player seek only.
 */
export const useLocalVideoScrubber = ({ durationSec, enabled }: Options) => {
  const [frames, setFrames] = useState<VideoFrameThumb[]>([]);

  const ready = enabled && durationSec > 0;

  useEffect(() => {
    if (!ready) {
      setFrames([]);
      return;
    }
    setFrames(buildScrubberFrames(durationSec));
  }, [durationSec, ready]);

  return useMemo(
    () => ({
      frames,
      ready,
    }),
    [frames, ready],
  );
};
