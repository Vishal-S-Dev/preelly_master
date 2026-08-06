import { useMutation } from '@tanstack/react-query';
import { ListingApi } from '../../data/api/ListingApi';
import { VideoApi } from '../../data/api/VideoApi';
import { VIDEO_CONSTRAINTS } from '../../constants/createPostConstants';
import { useCreatePostStore } from '../../store/createPostStore';

const isVehicleCategory = (name?: string) =>
  /vehicles?|motors?|cars?|auto/i.test(String(name ?? ''));

export const useCreatePostTranscription = () => {
  const store = useCreatePostStore();

  return useMutation({
    mutationFn: async () => {
      const video = store.video;
      if (!video) {
        throw new Error('Please upload a video first.');
      }

      const transcriptResponse = await VideoApi.transcribeVideo({
        videoUri: video.uri,
        videoName: video.name,
        videoType: video.type,
        category: store.categoryName,
        subcategory: store.subcategoryName,
        categoryId: store.dynamicFormCategoryId ?? store.subcategoryId ?? store.categoryId,
        subcategoryId: store.subcategoryId,
      });

      store.setTranscript(transcriptResponse.transcript ?? '');
      store.setExtractedData(transcriptResponse.extractedData ?? null);
      store.setSuggestedFilters(transcriptResponse.suggestedFilters ?? null);

      if (
        isVehicleCategory(store.categoryName) &&
        transcriptResponse.transcript?.trim()
      ) {
        try {
          const ai = await ListingApi.aiExtract(transcriptResponse.transcript);
          store.setAiExtraction(ai);
        } catch {
          store.setAiExtraction(null);
        }
      }

      // Single upload — the server samples the video and returns several curated shots,
      // instead of re-uploading the whole video once per timestamp.
      const screenshotUrls = await VideoApi.autoCaptureScreenshots(
        video.uri,
        video.name,
        video.type,
      ).catch(() => [] as string[]);

      const screenshots = screenshotUrls
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

      store.setImages(screenshots);
      store.applyExtractionToFields();

      return transcriptResponse;
    },
  });
};
