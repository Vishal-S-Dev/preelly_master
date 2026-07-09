import { ProductApi } from '../../../../../data/api/ProductApi';
import { ProductDTO } from '../../../../../data/dto/ProductDTO';
import { CreatePostMediaFile } from '../../../../../types/createPost.types';

export const resolveProductDtoVideoUrl = (dto: ProductDTO): string | undefined => {
  const raw = dto.video?.trim();
  if (!raw) {
    return undefined;
  }
  return ProductApi.withBase(raw);
};

export const buildRemoteVideoMediaFile = (url: string): CreatePostMediaFile => {
  const trimmed = url.trim();
  const fileName = trimmed.split('/').pop()?.split('?')[0] || 'product-video.mp4';

  return {
    uri: trimmed,
    name: fileName,
    type: fileName.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
    size: 0,
  };
};

/** Prefer a newly picked local file; otherwise play the hydrated server MP4. */
export const resolveEditProductPlaybackVideo = (
  video: CreatePostMediaFile | null | undefined,
  remoteVideoUrl?: string,
): CreatePostMediaFile | null => {
  if (video?.uri?.trim()) {
    return video;
  }
  if (remoteVideoUrl?.trim()) {
    return buildRemoteVideoMediaFile(remoteVideoUrl);
  }
  return null;
};
