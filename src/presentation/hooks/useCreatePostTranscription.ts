import { useMutation } from '@tanstack/react-query';
import { ListingApi } from '../../data/api/ListingApi';
import { VideoApi } from '../../data/api/VideoApi';
import { SCREENSHOT_TIMESTAMPS_SEC } from '../../constants/createPostConstants';
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

      const screenshots: Array<{ id: string; uri: string; fromVideo: boolean }> = [];
      for (const timestamp of SCREENSHOT_TIMESTAMPS_SEC) {
        const url = await VideoApi.captureScreenshot(
          video.uri,
          video.name,
          video.type,
          timestamp,
        );
        if (url) {
          screenshots.push({
            id: `shot_${timestamp}`,
            uri: url,
            fromVideo: true,
          });
        }
      }

      if (__DEV__) {
        console.log(
          `[CreatePost:screenshots] captured=${screenshots.length}`,
          screenshots.map(item => item.uri),
        );
      }

      store.setImages(screenshots.slice(0, 1));
      store.applyExtractionToFields();

      if (transcriptResponse.extractedData?.title) {
        store.setTitle(String(transcriptResponse.extractedData.title));
      }
      if (transcriptResponse.extractedData?.description) {
        store.setDescription(String(transcriptResponse.extractedData.description));
      }

      return transcriptResponse;
    },
  });
};
