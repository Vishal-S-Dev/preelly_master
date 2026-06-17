import { ENV } from '../../constants/env';
import { AiListingExtraction } from '../../types/createPost.types';
import { httpClient } from './httpClient';

const API_BASE = ENV.API_BASE_URL;

export const ListingApi = {
  async aiExtract(inputText: string): Promise<AiListingExtraction> {
    const { data } = await httpClient.post<AiListingExtraction | { data: AiListingExtraction }>(
      '/listings/ai-extract',
      { input_text: inputText },
      { baseURL: API_BASE, timeout: 90000 },
    );
    return (data as { data?: AiListingExtraction })?.data ?? (data as AiListingExtraction);
  },
};
