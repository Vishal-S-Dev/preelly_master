import { Platform } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import RNFS from 'react-native-fs';

const FRAMES_DIR = `${RNFS.DocumentDirectoryPath}/post_ad_frames`;

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

  for (const timeStampMs of candidates) {
    try {
      const tempPath = await extractThumbnail(videoUri, timeStampMs, options);
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
