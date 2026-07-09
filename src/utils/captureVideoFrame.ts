import { VideoApi } from '../data/api/VideoApi';
import { CreatePostMediaFile } from '../types/createPost.types';
import { captureVideoFrameLocally, resolveVideoUriForFrameCapture } from './localVideoFrameCapture';

const isRemoteVideoUri = (uri: string): boolean => /^https?:\/\//i.test(uri.trim());

/**
 * Captures a video frame: tries on-device extraction first, then server screenshot API.
 */
export const captureVideoFrame = async (
  video: CreatePostMediaFile,
  timeSec: number,
): Promise<string | null> => {
  const resolvedUri = await resolveVideoUriForFrameCapture(video.uri);
  const local = await captureVideoFrameLocally(video.uri, timeSec);
  if (local) {
    return local;
  }

  if (__DEV__) {
    console.log('[captureVideoFrame] local failed, trying server', { timeSec });
  }

  const serverVideo =
    resolvedUri.startsWith('file://') || resolvedUri.startsWith('/')
      ? {
          ...video,
          uri: resolvedUri,
          name: video.name || 'product-video.mp4',
        }
      : video;

  if (isRemoteVideoUri(video.uri) && !resolvedUri.startsWith('file')) {
    return null;
  }

  return VideoApi.captureScreenshot(
    serverVideo.uri,
    serverVideo.name,
    serverVideo.type,
    timeSec,
  );
};
