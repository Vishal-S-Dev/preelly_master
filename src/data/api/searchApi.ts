import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants/appConstants';
import { PopularSearchesData } from '../../types/search.types';
import { httpClient } from './httpClient';

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

const searchHeaders = {
  'device-id': Platform.OS === 'ios' ? 'iphone' : 'android',
};

export const SearchApi = {
  async getPopularSearches(limit = 10): Promise<PopularSearchesData> {
    const { data } = await httpClient.get<ApiEnvelope<PopularSearchesData>>(
      API_ENDPOINTS.SEARCH_POPULAR,
      { params: { limit }, headers: searchHeaders },
    );
    const payload = data.data ?? { keywords: [], items: [], total: 0 };
    return {
      keywords: payload.keywords ?? [],
      items: payload.items ?? [],
      total: payload.total ?? payload.keywords?.length ?? 0,
    };
  },

  async getSuggestions(keyword: string, limit = 10): Promise<string[]> {
    const { data } = await httpClient.get<ApiEnvelope<{ suggestions?: string[] }>>(
      API_ENDPOINTS.SEARCH_SUGGESTIONS,
      {
        params: { keyword: keyword.trim(), limit },
        headers: searchHeaders,
      },
    );
    return data.data?.suggestions ?? [];
  },
};
