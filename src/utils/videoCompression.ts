import RNFS from 'react-native-fs';
import { Video as VideoCompressor } from 'react-native-compressor';
import { CreatePostMediaFile } from '../types/createPost.types';

/** Videos already under this size aren't worth re-encoding — the savings are marginal and
 * re-compressing an already-small clip can occasionally bloat it back up. */
const MIN_SIZE_MB_FOR_COMPRESSION = 4;

const toLocalPath = (uri: string): string =>
  uri.startsWith('file://') ? uri.slice('file://'.length) : uri;

const statSizeBytes = async (uri: string): Promise<number | null> => {
  try {
    const stat = await RNFS.stat(toLocalPath(uri));
    return stat.size;
  } catch {
    return null;
  }
};

const formatSize = (bytes: number | null): string =>
  bytes == null ? 'unknown' : `${(bytes / (1024 * 1024)).toFixed(2)}MB`;

const logCompressionResult = (label: string, originalBytes: number | null, compressedBytes?: number | null) => {
  if (!__DEV__) {
    return;
  }
  const suffix =
    compressedBytes === undefined
      ? ''
      : ` -> compressed=${formatSize(compressedBytes)}`;
  console.log(`[videoCompression] ${label}: original=${formatSize(originalBytes)}${suffix}`);
};

/**
 * Re-encodes a video for upload — used both right before the `/api/video/analyze` upload (so
 * that upload isn't sending the full, uncompressed source file) and again just before the final
 * publish request (in case the draft's video was replaced/edited since the analyze step).
 *
 * Uses the library's "auto" method, which derives a bitrate/resolution target from the source
 * clip's own dimensions, bitrate and frame rate rather than a fixed downscale — this shrinks
 * typical phone-camera footage substantially with no visible quality loss, unlike a blanket
 * resolution cap that would degrade an already-modest source video.
 *
 * A failure here (or the video already being small enough to skip) falls back to the original
 * file, so a device/codec quirk can never block posting.
 */
export const compressVideoForUpload = async (
  video: CreatePostMediaFile,
): Promise<CreatePostMediaFile> => {
  const originalSizeBytes = await statSizeBytes(video.uri);

  try {
    const compressedUri = await VideoCompressor.compress(video.uri, {
      compressionMethod: 'auto',
      minimumFileSizeForCompress: MIN_SIZE_MB_FOR_COMPRESSION,
    });

    if (!compressedUri || compressedUri === video.uri) {
      logCompressionResult('skipped (already small, or unchanged)', originalSizeBytes);
      return video;
    }

    // The compressor's promise can resolve with a URI whose file was never actually written
    // (observed on the iOS Simulator, which lacks a real hardware video encoder) — uploading
    // that path wouldn't error, it would just silently vanish from the multipart request, since
    // RN's networking layer drops an unreadable file part instead of failing the whole request.
    // That surfaces server-side as "video is required" with no client-side error at all, so
    // verify the file is really there before trusting it over the known-good original.
    const localPath = toLocalPath(compressedUri);
    const exists = await RNFS.exists(localPath).catch(() => false);
    if (!exists) {
      logCompressionResult('compressed file missing on disk, using original', originalSizeBytes);
      return video;
    }

    const compressedSizeBytes = await statSizeBytes(compressedUri);
    logCompressionResult('compressed', originalSizeBytes, compressedSizeBytes);

    // The compressor always re-encodes into an MP4 container, regardless of the source
    // format (e.g. iOS camera clips are picked as .mov/video/quicktime) — keeping the
    // original name/mime here would upload an .mp4-encoded file mislabeled as quicktime,
    // which some backend validators reject outright as "not a valid video" even though the
    // file itself is playable.
    const nameWithoutExt = video.name.replace(/\.[^./]+$/, '');
    return {
      ...video,
      uri: compressedUri,
      name: `${nameWithoutExt || 'video'}.mp4`,
      type: 'video/mp4',
    };
  } catch (error) {
    if (__DEV__) {
      console.log('[videoCompression] failed, using original', error);
    }
    return video;
  }
};
