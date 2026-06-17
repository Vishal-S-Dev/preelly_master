/**
 * @deprecated Use useLocalVideoScrubber + captureVideoFrameLocally instead.
 * Kept for backwards compatibility — no API calls.
 */
import { useCallback } from 'react';
import { useLocalVideoScrubber } from './useLocalVideoScrubber';
import { VideoFrameExtractorOptions, VideoFrameExtractorResult } from '../../types/videoFrame.types';

export const useVideoFrameExtractor = ({
  durationSec,
  enabled,
}: VideoFrameExtractorOptions): VideoFrameExtractorResult => {
  const { frames, ready } = useLocalVideoScrubber({ durationSec, enabled });

  const getFrameUri = useCallback(() => null, []);

  const captureAtTime = useCallback(async () => null, []);

  return {
    frames,
    status: ready ? 'ready' : 'idle',
    error: null,
    progress: ready ? 1 : 0,
    retry: () => undefined,
    getFrameUri,
    captureAtTime,
  };
};
