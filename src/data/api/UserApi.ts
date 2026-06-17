import { ENV } from '../../constants/env';
import { httpClient } from './httpClient';
import { LocationPayload } from '../../types/profileEdit.types';
import { ProfileApiUserDTO } from '../../services/profile.service';
import {
  UserFollowToggleResponseDTO,
  UserProfileDTO,
} from '../../types/userProfile.types';

const API_BASE = ENV.API_BASE_URL;

export interface LocationDTO {
  _id?: string;
  id?: string;
  label?: string;
  city?: string;
  building?: string;
  apartment?: string;
  isDefault?: boolean;
  coordinates?: {
    coordinates?: [number, number];
  };
}

interface UploadImageFile {
  uri: string;
  type: string;
  fileName: string;
}

const unwrap = <T>(data: T | { data: T }): T =>
  data && typeof data === 'object' && 'data' in (data as object)
    ? (data as { data: T }).data
    : data;

export const UserApi = {
  async getProfile(): Promise<ProfileApiUserDTO> {
    const { data } = await httpClient.get<ProfileApiUserDTO | { data: ProfileApiUserDTO }>(
      '/api/user/profile',
      { baseURL: API_BASE },
    );
    return unwrap(data);
  },

  async updateProfile(payload: UserProfileDTO): Promise<ProfileApiUserDTO> {
    const { data } = await httpClient.put<ProfileApiUserDTO | { data: ProfileApiUserDTO }>(
      '/api/user/profile',
      payload,
      { baseURL: API_BASE },
    );
    return unwrap(data);
  },

  async updateProfileAvatar(
    file: UploadImageFile,
    name = '',
    onUploadProgress?: (progress: number) => void,
  ): Promise<ProfileApiUserDTO> {
    const formData = new FormData();
    formData.append('profilePic', {
      uri: file.uri,
      type: file.type,
      name: file.fileName,
    } as unknown as Blob);
    formData.append('name', name);

    const { data } = await httpClient.post<ProfileApiUserDTO | { data: ProfileApiUserDTO }>(
      '/api/user/profile',
      formData,
      {
        baseURL: API_BASE,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
        onUploadProgress: event => {
          if (!event.total || !onUploadProgress) {
            return;
          }
          const progress = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(progress);
        },
      },
    );

    return unwrap(data);
  },

  async getLocations(): Promise<LocationDTO[]> {
    try {
      const { data } = await httpClient.get<{ locations?: LocationDTO[] } | LocationDTO[]>(
        '/user/locations',
        { baseURL: API_BASE },
      );
      if (Array.isArray(data)) {
        return data;
      }
      return data?.locations ?? [];
    } catch {
      return [];
    }
  },

  async addLocation(payload: LocationPayload): Promise<LocationDTO> {
    const { data } = await httpClient.post<{ location?: LocationDTO } | LocationDTO>(
      '/user/locations',
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    if (body && typeof body === 'object' && 'location' in body) {
      return (body as { location: LocationDTO }).location;
    }
    return body as LocationDTO;
  },

  async updateLocation(locId: string, payload: LocationPayload): Promise<LocationDTO> {
    const { data } = await httpClient.put<{ location?: LocationDTO } | LocationDTO>(
      `/user/locations/${locId}`,
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    if (body && typeof body === 'object' && 'location' in body) {
      return (body as { location: LocationDTO }).location;
    }
    return body as LocationDTO;
  },

  async deleteLocation(locId: string): Promise<void> {
    await httpClient.delete(`/user/locations/${locId}`, { baseURL: API_BASE });
  },

  async toggleFollow(userId: string): Promise<UserFollowToggleResponseDTO> {
    const { data } = await httpClient.post<UserFollowToggleResponseDTO>(
      `/api/user/${userId}/follow`,
      undefined,
      { baseURL: API_BASE },
    );
    return unwrap(data);
  },
};
