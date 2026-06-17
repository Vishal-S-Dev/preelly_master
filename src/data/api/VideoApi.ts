import { ENV } from '../../constants/env';
import { TranscribeVideoResponse } from '../../types/createPost.types';
import { httpClient } from './httpClient';

const API_BASE = ENV.API_BASE_URL;

export interface VideoScreenshotResponse {
  success?: boolean;
  screenshot?: {
    url?: string;
    path?: string;
    timestamp?: number;
  };
  url?: string;
  imageUrl?: string;
  data?: { url?: string };
}

const withMediaBase = (path: string): string =>
  path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

export const parseScreenshotResponseUrl = (data: VideoScreenshotResponse): string | null => {
  const raw =
    data.screenshot?.url ??
    data.url ??
    data.imageUrl ??
    data.data?.url ??
    null;
  if (!raw?.trim()) {
    return null;
  }
  return withMediaBase(raw.trim());
};

export interface TranscribeVideoParams {
  videoUri: string;
  videoName: string;
  videoType: string;
  category?: string;
  subcategory?: string;
  categoryId?: string;
  subcategoryId?: string;
  childCategoryId?: string;
}

export const VideoApi = {
  async transcribeVideo(params: TranscribeVideoParams): Promise<TranscribeVideoResponse> {
    const formData = new FormData();
    formData.append('video', {
      uri: params.videoUri,
      name: params.videoName,
      type: params.videoType,
    } as unknown as Blob);
    if (params.category) {
      formData.append('category', params.category);
    }
    if (params.subcategory) {
      formData.append('subcategory', params.subcategory);
    }
    if (params.categoryId) {
      formData.append('categoryId', params.categoryId);
    }
    if (params.subcategoryId) {
      formData.append('subcategoryId', params.subcategoryId);
    }
    if (params.childCategoryId) {
      formData.append('childCategoryId', params.childCategoryId);
    }

    const { data } = await httpClient.post<TranscribeVideoResponse>('/api/video/transcribe', formData, {
      baseURL: API_BASE,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  },

  async captureScreenshot(
    videoUri: string,
    videoName: string,
    videoType: string,
    timestamp: number,
  ): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        name: videoName,
        type: videoType,
      } as unknown as Blob);
      formData.append('timestamp', String(timestamp));
      const { data } = await httpClient.post<VideoScreenshotResponse>(
        '/api/video/screenshot',
        formData,
        {
          baseURL: API_BASE,
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        },
      );
      const resolved = parseScreenshotResponseUrl(data);
      if (__DEV__) {
        console.log(
          `[VideoApi:captureScreenshot] timestamp=${timestamp}`,
          `raw=${JSON.stringify(data?.screenshot ?? data)}`,
          `resolved=${resolved}`,
        );
      }
      return resolved;
    } catch (error) {
      if (__DEV__) {
        console.log(`[VideoApi:captureScreenshot] timestamp=${timestamp} failed`, error);
      }
      return null;
    }
  },

  withMediaBase,
};
