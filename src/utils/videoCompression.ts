import { Video as VideoCompressor } from 'react-native-compressor';
import { CreatePostMediaFile } from '../types/createPost.types';

/** Videos already under this size aren't worth re-encoding — the savings are marginal and
 * re-compressing an already-small clip can occasionally bloat it back up. */
const MIN_SIZE_MB_FOR_COMPRESSION = 4;

/**
 * Re-encodes a video for upload just before it's attached to the publish request.
 *
 * Uses the library's "auto" method, which derives a bitrate/resolution target from the source
 * clip's own dimensions, bitrate and frame rate rather than a fixed downscale — this shrinks
 * typical phone-camera footage substantially with no visible quality loss, unlike a blanket
 * resolution cap that would degrade an already-modest source video.
 *
 * Runs only at publish time, after trimming/preview are done, so it never touches the uri the
 * rest of the create-post flow (preview, trim editor) is working with — a failure here falls
 * back to the original file so a device/codec quirk can never block posting.
 */
export const compressVideoForUpload = async (
  video: CreatePostMediaFile,
): Promise<CreatePostMediaFile> => {
  try {
    const compressedUri = await VideoCompressor.compress(video.uri, {
      compressionMethod: 'auto',
      minimumFileSizeForCompress: MIN_SIZE_MB_FOR_COMPRESSION,
    });

    if (!compressedUri || compressedUri === video.uri) {
      return video;
    }

    return { ...video, uri: compressedUri };
  } catch {
    return video;
  }
};
