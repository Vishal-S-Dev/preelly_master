import { VIDEO_CONSTRAINTS } from '../constants/createPostConstants';
import { CreatePostMediaFile } from '../types/createPost.types';

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export const validateVideoFile = (file: CreatePostMediaFile): VideoValidationResult => {
  const mime = file.type?.toLowerCase() ?? '';
  const allowed = VIDEO_CONSTRAINTS.allowedMimeTypes.some(type => mime.includes(type.split('/')[1]));
  if (!allowed && !mime.includes('video')) {
    return { valid: false, error: 'Only MP4 or MOV video formats are supported.' };
  }

  if (file.size > VIDEO_CONSTRAINTS.maxSizeBytes) {
    return { valid: false, error: 'Video must be 20MB or smaller.' };
  }

  if (file.duration && file.duration > VIDEO_CONSTRAINTS.maxDurationSec) {
    return { valid: false, error: 'Video must be 2 minutes or shorter.' };
  }

  if (file.duration && file.duration < VIDEO_CONSTRAINTS.minDurationSec) {
    return { valid: false, error: 'Video is too short. Please upload at least 3 seconds.' };
  }

  // 16:9 aspect ratio validation — disabled for now
  // if (file.width && file.height) {
  //   const ratio = file.width / file.height;
  //   const target = VIDEO_CONSTRAINTS.aspectRatio;
  //   const delta = Math.abs(ratio - target) / target;
  //   if (delta > VIDEO_CONSTRAINTS.aspectTolerance) {
  //     return { valid: false, error: 'Video must be in 16:9 aspect ratio.' };
  //   }
  // }

  return { valid: true };
};

export const mapPickerAssetToVideo = (asset: {
  uri?: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
}): CreatePostMediaFile | null => {
  if (!asset.uri) {
    return null;
  }
  return {
    uri: asset.uri,
    name: asset.fileName ?? `video_${Date.now()}.mp4`,
    type: asset.type ?? 'video/mp4',
    size: asset.fileSize ?? 0,
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
  };
};
