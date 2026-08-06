import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  CreateSavedSearchPayload,
  SavedSearchDTO,
  SavedSearchesResponseDTO,
} from '../../types/savedSearch.types';
import { httpClient } from './httpClient';

const savedSearchHeaders = {
  'device-id': Platform.OS === 'ios' ? 'iphone' : 'android',
};

export const SavedSearchApi = {
  async getSavedSearches(): Promise<SavedSearchesResponseDTO> {
    const { data } = await httpClient.get<SavedSearchesResponseDTO>(
      API_ENDPOINTS.SAVED_SEARCHES,
      { headers: savedSearchHeaders },
    );
    return { savedSearches: data.savedSearches ?? [], tabs: data.tabs ?? [] };
  },

  async updateSavedSearch(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<SavedSearchDTO | null> {
    const { data } = await httpClient.put<{ savedSearch?: SavedSearchDTO }>(
      `${API_ENDPOINTS.SAVED_SEARCHES}/${id}`,
      payload,
    );
    return data.savedSearch ?? null;
  },

  async createSavedSearch(payload: CreateSavedSearchPayload): Promise<SavedSearchDTO> {
    const { data } = await httpClient.post<{ savedSearch: SavedSearchDTO }>(
      API_ENDPOINTS.SAVED_SEARCHES,
      payload,
      { headers: savedSearchHeaders },
    );
    return data.savedSearch;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    await httpClient.delete(`${API_ENDPOINTS.SAVED_SEARCHES}/${id}`);
  },
};
