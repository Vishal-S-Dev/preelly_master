import { ENV } from '../../constants/env';
import { httpClient } from './httpClient';
import { LocationPayload } from '../../types/profileEdit.types';
import { ProfileApiUserDTO } from '../../services/profile.service';
import {
  UserFollowStatusResponseDTO,
  UserFollowToggleResponseDTO,
  UserProfileDTO,
} from '../../types/userProfile.types';
import { API_ENDPOINTS } from '../../constants/appConstants';

const API_BASE = ENV.API_BASE_URL;

export interface LocationDTO {
  _id?: string;
  id?: string;
  label?: string;
  city?: string;
  building?: string;
  apartment?: string;
  detailLocation?: string;
  isDefault?: boolean;
  coordinates?: [number, number] | {
    coordinates?: [number, number];
    type?: string;
  };
}

interface UploadImageFile {
  uri: string;
  type: string;
  fileName: string;
}

export interface IdentityVerificationResponse {
  message?: string;
  isVerified?: boolean;
  verified?: boolean;
  status?: string;
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
        '/api/user/locations',
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
      '/api/user/locations',
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
      `/api/user/locations/${locId}`,
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
    await httpClient.delete(`/api/user/locations/${locId}`, { baseURL: API_BASE });
  },

  async submitIdentityVerification(
    front: UploadImageFile,
    back: UploadImageFile,
    onUploadProgress?: (progress: number) => void,
  ): Promise<IdentityVerificationResponse> {
    const formData = new FormData();
    formData.append('emiratesIdFront', {
      uri: front.uri,
      type: front.type,
      name: front.fileName,
    } as unknown as Blob);
    formData.append('emiratesIdBack', {
      uri: back.uri,
      type: back.type,
      name: back.fileName,
    } as unknown as Blob);

    const { data } = await httpClient.post<
      IdentityVerificationResponse | { data: IdentityVerificationResponse }
    >(API_ENDPOINTS.IDENTITY_VERIFICATION, formData, {
      baseURL: ENV.API_BASE_URL,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
      onUploadProgress: event => {
        if (!event.total || !onUploadProgress) {
          return;
        }
        const progress = Math.round((event.loaded / event.total) * 100);
        onUploadProgress(progress);
      },
    });

    return unwrap(data);
  },

  async toggleFollow(userId: string): Promise<UserFollowToggleResponseDTO> {
    const { data } = await httpClient.post<UserFollowToggleResponseDTO>(
      `/api/user/${userId}/follow`,
      undefined,
      { baseURL: API_BASE },
    );
    return unwrap(data);
  },

  async getFollowStatus(userId: string): Promise<UserFollowStatusResponseDTO> {
    const { data } = await httpClient.get<UserFollowStatusResponseDTO>(
      `/api/user/${userId}/follow-status`,
      { baseURL: API_BASE },
    );
    return unwrap(data);
  },
};
