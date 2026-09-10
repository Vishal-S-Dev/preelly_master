import { useMutation } from '@tanstack/react-query';
import { AxiosProgressEvent } from 'axios';
import { ListingApi } from '../../data/api/ListingApi';
import { VideoApi } from '../../data/api/VideoApi';
import { VIDEO_CONSTRAINTS } from '../../constants/createPostConstants';
import { useCreatePostStore } from '../../store/createPostStore';
import { compressVideoForUpload } from '../../utils/videoCompression';

const isVehicleCategory = (name?: string) =>
  /vehicles?|motors?|cars?|auto/i.test(String(name ?? ''));

export interface CreatePostTranscriptionVars {
  /** Real multipart upload progress for the video, forwarded straight from axios. */
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  /** Lets a caller (e.g. a "Cancel" button on a progress sheet) abort the in-flight upload. */
  signal?: AbortSignal;
}

export const useCreatePostTranscription = () => {
  const store = useCreatePostStore();

  return useMutation({
    mutationFn: async (vars: CreatePostTranscriptionVars = {}) => {
      const video = store.video;
      if (!video) {
        throw new Error('Please upload a video first.');
      }

      // Compress before this upload too (previously only done at final-publish time) — this is
      // usually the largest upload in the whole create-post flow (the full source clip, not yet
      // trimmed down for publish), so shrinking it here cuts real time/bandwidth. Persist the
      // compressed file back onto the draft so the later publish step re-uses it instead of
      // uploading the original a second time.
      const uploadVideo = await compressVideoForUpload(video);
      if (uploadVideo.uri !== video.uri) {
        store.setVideo(uploadVideo);
      }

      // Compression has no cancellation hook of its own, so the earliest we can honor a
      // cancel request is right before the network call actually starts.
      if (vars.signal?.aborted) {
        const cancelled = new Error('Upload cancelled');
        cancelled.name = 'AbortError';
        throw cancelled;
      }

      // Single upload — one call to /api/video/analyze returns both the transcript/extraction
      // data and curated screenshots, instead of uploading the whole video twice (once for
      // transcription, once again for auto-capture-screenshots).
      const analysis = await VideoApi.analyzeVideo({
        videoUri: uploadVideo.uri,
        videoName: uploadVideo.name,
        videoType: uploadVideo.type,
        category: store.categoryName,
        subcategory: store.subcategoryName,
        categoryId: store.categoryId,
        subcategoryId: store.subcategoryId,
        childCategoryId: store.dynamicFormCategoryId ?? store.subcategoryId,
        onUploadProgress: vars.onUploadProgress,
        signal: vars.signal,
      });

      store.setTranscript(analysis.transcript ?? '');
      store.setExtractedData(analysis.extractedData ?? null);
      store.setSuggestedFilters(analysis.suggestedFilters ?? null);

      if (isVehicleCategory(store.categoryName) && analysis.transcript?.trim()) {
        try {
          const ai = await ListingApi.aiExtract(analysis.transcript);
          store.setAiExtraction(ai);
        } catch {
          store.setAiExtraction(null);
        }
      }

      const screenshots = (analysis.screenshots ?? [])
        .map(shot => shot.url?.trim())
        .filter((url): url is string => Boolean(url))
        .map(url => VideoApi.withMediaBase(url))
        .slice(0, VIDEO_CONSTRAINTS.maxImages)
        .map((url, index) => ({
          id: `shot_${index}`,
          uri: url,
          fromVideo: true,
        }));

      if (__DEV__) {
        console.log(
          `[CreatePost:screenshots] captured=${screenshots.length}`,
          screenshots.map(item => item.uri),
        );
      }

      // Only replace images if analysis actually produced some screenshots — otherwise (the
      // video yielded nothing usable, or the field was simply absent) this would wipe out any
      // images the user already has.
      if (screenshots.length > 0) {
        store.setImages(screenshots);
      }
      store.applyExtractionToFields();

      return analysis;
    },
  });
};
