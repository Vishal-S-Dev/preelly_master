import RNFS from 'react-native-fs';
import { ENV } from '../../constants/env';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { TranscribeVideoResponse } from '../../types/createPost.types';
import { storage } from '../../utils/storage';
import { httpClient } from './httpClient';

const API_BASE = ENV.API_BASE_URL;
const TRIMMED_VIDEO_DIR = `${RNFS.CachesDirectoryPath}/trimmed_videos`;

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

export interface TrimVideoParams {
  videoUri: string;
  videoName: string;
  videoType: string;
  startTime: number;
  endTime: number;
}

export interface TrimVideoResult {
  uri: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
}

interface TrimVideoResponse {
  success?: boolean;
  video?: {
    url?: string;
    name?: string;
    size?: number;
    duration?: number;
    startTime?: number;
    endTime?: number;
  };
}

const downloadTrimmedVideo = async (remoteUrl: string, fileName: string): Promise<string> => {
  const exists = await RNFS.exists(TRIMMED_VIDEO_DIR);
  if (!exists) {
    await RNFS.mkdir(TRIMMED_VIDEO_DIR);
  }
  const destPath = `${TRIMMED_VIDEO_DIR}/${Date.now()}_${fileName}`;
  const token = await storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const result = await RNFS.downloadFile({ fromUrl: remoteUrl, toFile: destPath, headers }).promise;
  if (result.statusCode && result.statusCode >= 400) {
    throw new Error('Failed to download the trimmed video. Please try again.');
  }
  return `file://${destPath}`;
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

  /**
   * AI-guided cinematic multi-shot capture — uploads the video ONCE and gets back several
   * curated screenshots server-side (mirrors web's `/ai/auto-capture-screenshots`), instead of
   * re-uploading the whole video per timestamp like `captureScreenshot` below.
   */
  async autoCaptureScreenshots(
    videoUri: string,
    videoName: string,
    videoType: string,
  ): Promise<string[]> {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      name: videoName,
      type: videoType,
    } as unknown as Blob);

    const { data } = await httpClient.post<{
      success?: boolean;
      count?: number;
      screenshots?: Array<{ url?: string; path?: string; timestamp?: number | null; shotType?: string | null }>;
    }>('/api/ai/auto-capture-screenshots', formData, {
      baseURL: API_BASE,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });

    return (data.screenshots ?? [])
      .map(shot => shot.url?.trim())
      .filter((url): url is string => Boolean(url))
      .map(url => withMediaBase(url));
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

  /**
   * Server-side trim (ffmpeg) — mirrors web's `VideoCropEditor` → `POST /api/video/trim`.
   * Replaces the whole video file; the backend enforces a 15s minimum span.
   */
  async trimVideo(params: TrimVideoParams): Promise<TrimVideoResult> {
    const formData = new FormData();
    formData.append('video', {
      uri: params.videoUri,
      name: params.videoName,
      type: params.videoType,
    } as unknown as Blob);
    formData.append('startTime', String(params.startTime));
    formData.append('endTime', String(params.endTime));

    const { data } = await httpClient.post<TrimVideoResponse>('/api/video/trim', formData, {
      baseURL: API_BASE,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    });

    const video = data.video;
    if (!video?.url) {
      throw new Error('Video trim failed. Please try again.');
    }

    const name = video.name ?? params.videoName;
    const localUri = await downloadTrimmedVideo(withMediaBase(video.url), name);

    return {
      uri: localUri,
      name,
      type: params.videoType,
      size: video.size ?? 0,
      duration: video.duration,
    };
  },

  withMediaBase,
};
