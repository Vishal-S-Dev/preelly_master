import { CreatePostMediaFile } from './createPost.types';

export type FrameExtractionStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface VideoFrameThumb {
  /** Seconds from start */
  time: number;
  /** Local or remote URI; null while loading */
  uri: string | null;
  /** Index in timeline strip */
  index: number;
}

export interface VideoFrameExtractorOptions {
  video: CreatePostMediaFile | null;
  durationSec: number;
  enabled: boolean;
  /** Seconds between thumbnails (default 1) */
  intervalSec?: number;
  maxFrames?: number;
}

export interface VideoFrameExtractorResult {
  frames: VideoFrameThumb[];
  status: FrameExtractionStatus;
  error: string | null;
  progress: number;
  retry: () => void;
  getFrameUri: (timeSec: number) => string | null;
  captureAtTime: (timeSec: number) => Promise<string | null>;
}

export interface VideoFrameScrubberProps {
  frames: VideoFrameThumb[];
  durationSec: number;
  currentTimeSec: number;
  onScrub: (timeSec: number) => void;
  onScrubEnd?: (timeSec: number) => void;
  disabled?: boolean;
  isScrubbing?: boolean;
  /** When true, filmstrip scroll position tracks currentTimeSec (use while paused). */
  followTimeline?: boolean;
  formatTime?: (timeSec: number) => string;
}
