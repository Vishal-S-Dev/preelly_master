import { Platform } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import RNFS from 'react-native-fs';

const FRAMES_DIR = `${RNFS.DocumentDirectoryPath}/post_ad_frames`;
const REMOTE_VIDEO_CACHE_DIR = `${RNFS.CachesDirectoryPath}/remote_video_frames`;

const isRemoteVideoUri = (uri: string): boolean => /^https?:\/\//i.test(uri.trim());

const remoteVideoCacheKey = (uri: string): string => {
  let hash = 0;
  for (let i = 0; i < uri.length; i += 1) {
    hash = (Math.imul(31, hash) + uri.charCodeAt(i)) | 0;
  }
  return `remote_${Math.abs(hash)}.mp4`;
};

const remoteVideoCache = new Map<string, Promise<string | null>>();

/** Download remote MP4 to cache so native frame extractors receive a local file path. */
export const resolveVideoUriForFrameCapture = async (videoUri: string): Promise<string> => {
  const trimmed = videoUri.trim();
  if (!trimmed || !isRemoteVideoUri(trimmed)) {
    return normalizeVideoUri(trimmed);
  }

  const inFlight = remoteVideoCache.get(trimmed);
  if (inFlight) {
    const cached = await inFlight;
    return cached ?? normalizeVideoUri(trimmed);
  }

  const downloadPromise = (async (): Promise<string | null> => {
    try {
      const cacheDirExists = await RNFS.exists(REMOTE_VIDEO_CACHE_DIR);
      if (!cacheDirExists) {
        await RNFS.mkdir(REMOTE_VIDEO_CACHE_DIR);
      }

      const destPath = `${REMOTE_VIDEO_CACHE_DIR}/${remoteVideoCacheKey(trimmed)}`;
      if (await RNFS.exists(destPath)) {
        return toDisplayUri(destPath);
      }

      const result = await RNFS.downloadFile({ fromUrl: trimmed, toFile: destPath }).promise;
      if (result.statusCode >= 200 && result.statusCode < 300) {
        return toDisplayUri(destPath);
      }
      return null;
    } catch (error) {
      if (__DEV__) {
        console.log('[resolveVideoUriForFrameCapture] download failed', error);
      }
      return null;
    }
  })();

  remoteVideoCache.set(trimmed, downloadPromise);
  const localUri = await downloadPromise;
  return localUri ?? normalizeVideoUri(trimmed);
};

/** Normalize local video URI for native thumbnail APIs. */
export const normalizeVideoUri = (uri: string): string => {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return uri;
  }
  return `file://${uri}`;
};

const stripFilePrefix = (path: string): string => path.replace(/^file:\/\//, '');

const toDisplayUri = (path: string): string => {
  if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('http')) {
    return path;
  }
  if (Platform.OS === 'android' || path.startsWith('/')) {
    return `file://${path}`;
  }
  return path;
};

const timestampCandidatesMs = (timeSec: number): number[] => {
  const base = Math.max(0, Math.round(timeSec * 1000));
  const candidates = new Set<number>([base]);
  if (base === 0) {
    candidates.add(100);
    candidates.add(33);
  } else {
    candidates.add(Math.max(0, base - 33));
    candidates.add(base + 33);
  }
  return [...candidates];
};

export interface CaptureFrameOptions {
  maxWidth?: number;
  maxHeight?: number;
  persist?: boolean;
  timeToleranceMs?: number;
}

const extractThumbnail = async (
  videoUri: string,
  timeStampMs: number,
  options?: CaptureFrameOptions,
): Promise<string | null> => {
  const { path: tempPath } = await createThumbnail({
    url: normalizeVideoUri(videoUri),
    timeStamp: timeStampMs,
    format: 'jpeg',
    maxWidth: options?.maxWidth ?? 1920,
    maxHeight: options?.maxHeight ?? 1080,
    ...(Platform.OS === 'ios'
      ? { timeToleranceMs: options?.timeToleranceMs ?? 2000 }
      : { onlySyncedFrames: false }),
  });

  return tempPath || null;
};

const persistThumbnail = async (tempPath: string, timeStampMs: number): Promise<string> => {
  const exists = await RNFS.exists(FRAMES_DIR);
  if (!exists) {
    await RNFS.mkdir(FRAMES_DIR);
  }

  const destPath = `${FRAMES_DIR}/frame_${Date.now()}_${timeStampMs}.jpg`;
  const sourcePath = stripFilePrefix(tempPath);

  if (sourcePath === destPath || tempPath === destPath) {
    return toDisplayUri(tempPath);
  }

  try {
    const sourceExists = await RNFS.exists(sourcePath);
    if (!sourceExists) {
      return toDisplayUri(tempPath);
    }
    await RNFS.copyFile(sourcePath, destPath);
    return toDisplayUri(destPath);
  } catch {
    return toDisplayUri(tempPath);
  }
};

/**
 * Extract a single frame on-device (AVAssetImageGenerator / MediaMetadataRetriever).
 */
export const captureVideoFrameLocally = async (
  videoUri: string,
  timeSec: number,
  options?: CaptureFrameOptions,
): Promise<string | null> => {
  const persist = options?.persist !== false;
  const candidates = timestampCandidatesMs(timeSec);
  const resolvedUri = await resolveVideoUriForFrameCapture(videoUri);

  for (const timeStampMs of candidates) {
    try {
      const tempPath = await extractThumbnail(resolvedUri, timeStampMs, options);
      if (!tempPath) continue;

      if (!persist) {
        return toDisplayUri(tempPath);
      }

      return await persistThumbnail(tempPath, timeStampMs);
    } catch (error) {
      if (__DEV__) {
        console.log('[captureVideoFrameLocally] failed', { timeStampMs, error });
      }
    }
  }

  return null;
};

/** Remove frames saved during a picker session (optional cleanup). */
export const clearLocalFrameCache = async (): Promise<void> => {
  try {
    const exists = await RNFS.exists(FRAMES_DIR);
    if (exists) {
      await RNFS.unlink(FRAMES_DIR);
    }
  } catch {
    // ignore
  }
};
