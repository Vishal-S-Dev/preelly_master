import { VideoApi } from '../data/api/VideoApi';
import { CreatePostMediaFile } from '../types/createPost.types';
import { captureVideoFrameLocally } from './localVideoFrameCapture';

/**
 * Captures a video frame: tries on-device extraction first, then server screenshot API.
 */
export const captureVideoFrame = async (
  video: CreatePostMediaFile,
  timeSec: number,
): Promise<string | null> => {
  const local = await captureVideoFrameLocally(video.uri, timeSec);
  if (local) {
    return local;
  }

  if (__DEV__) {
    console.log('[captureVideoFrame] local failed, trying server', { timeSec });
  }

  return VideoApi.captureScreenshot(video.uri, video.name, video.type, timeSec);
};
