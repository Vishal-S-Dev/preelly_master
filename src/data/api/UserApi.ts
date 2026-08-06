import { ENV } from '../../constants/env';
import { httpClient } from './httpClient';
import {
  BankAccountPayload,
  LocationPayload,
  SavedCardPayload,
} from '../../types/profileEdit.types';
import { ProfileApiUserDTO } from '../../services/profile.service';
import {
  UserFollowStatusResponseDTO,
  UserFollowToggleResponseDTO,
  UserProfileDTO,
} from '../../types/userProfile.types';
import {
  BlockedUsersResponseDTO,
  UserSearchResponseDTO,
} from '../../types/blockedUsers.types';
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

export interface BankAccountDTO {
  _id?: string;
  id?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  branchName?: string;
  isPrimary?: boolean;
}

export interface SavedCardDTO {
  _id?: string;
  id?: string;
  brand?: string;
  last4?: string;
  expiry?: string;
  holderName?: string;
  nickname?: string;
  isPrimary?: boolean;
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

  async getBankAccounts(): Promise<BankAccountDTO[]> {
    try {
      const { data } = await httpClient.get<{ bankAccounts?: BankAccountDTO[] } | BankAccountDTO[]>(
        '/api/user/bank-accounts',
        { baseURL: API_BASE },
      );
      if (Array.isArray(data)) {
        return data;
      }
      return data?.bankAccounts ?? [];
    } catch {
      return [];
    }
  },

  async addBankAccount(payload: BankAccountPayload): Promise<BankAccountDTO> {
    const { data } = await httpClient.post<{ bankAccount?: BankAccountDTO } | BankAccountDTO>(
      '/api/user/bank-accounts',
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return body && typeof body === 'object' && 'bankAccount' in body
      ? (body as { bankAccount: BankAccountDTO }).bankAccount
      : (body as BankAccountDTO);
  },

  async updateBankAccount(accountId: string, payload: Partial<BankAccountPayload>): Promise<BankAccountDTO> {
    const { data } = await httpClient.put<{ bankAccount?: BankAccountDTO } | BankAccountDTO>(
      `/api/user/bank-accounts/${accountId}`,
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return body && typeof body === 'object' && 'bankAccount' in body
      ? (body as { bankAccount: BankAccountDTO }).bankAccount
      : (body as BankAccountDTO);
  },

  async deleteBankAccount(accountId: string): Promise<void> {
    await httpClient.delete(`/api/user/bank-accounts/${accountId}`, { baseURL: API_BASE });
  },

  async getSavedCards(): Promise<SavedCardDTO[]> {
    try {
      const { data } = await httpClient.get<{ savedCards?: SavedCardDTO[] } | SavedCardDTO[]>(
        '/api/user/saved-cards',
        { baseURL: API_BASE },
      );
      if (Array.isArray(data)) {
        return data;
      }
      return data?.savedCards ?? [];
    } catch {
      return [];
    }
  },

  async addSavedCard(payload: SavedCardPayload): Promise<SavedCardDTO> {
    const { data } = await httpClient.post<{ savedCard?: SavedCardDTO } | SavedCardDTO>(
      '/api/user/saved-cards',
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return body && typeof body === 'object' && 'savedCard' in body
      ? (body as { savedCard: SavedCardDTO }).savedCard
      : (body as SavedCardDTO);
  },

  async updateSavedCard(cardId: string, payload: Partial<SavedCardPayload>): Promise<SavedCardDTO> {
    const { data } = await httpClient.put<{ savedCard?: SavedCardDTO } | SavedCardDTO>(
      `/api/user/saved-cards/${cardId}`,
      payload,
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return body && typeof body === 'object' && 'savedCard' in body
      ? (body as { savedCard: SavedCardDTO }).savedCard
      : (body as SavedCardDTO);
  },

  async deleteSavedCard(cardId: string): Promise<void> {
    await httpClient.delete(`/api/user/saved-cards/${cardId}`, { baseURL: API_BASE });
  },

  /** Backend: POST /api/user/change-email/request { email } — sends an OTP to the NEW email. */
  async requestEmailChange(email: string): Promise<{ message: string; email: string; otpLength: number }> {
    const { data } = await httpClient.post(
      '/api/user/change-email/request',
      { email },
      { baseURL: API_BASE },
    );
    return data;
  },

  /** Backend: POST /api/user/change-email/verify { email, otp } */
  async verifyEmailChange(
    email: string,
    otp: string,
  ): Promise<{ message: string; email: string; isEmailVerified: boolean }> {
    const { data } = await httpClient.post(
      '/api/user/change-email/verify',
      { email, otp },
      { baseURL: API_BASE },
    );
    return data;
  },

  /** Backend: POST /api/user/change-phone/request { phone, phoneCountryCode, phoneCountryIso } — sends an OTP to the NEW phone. */
  async requestPhoneChange(
    phone: string,
    phoneCountryCode?: string,
    phoneCountryIso?: string,
  ): Promise<{ message: string; phone: string; otpLength: number }> {
    const { data } = await httpClient.post(
      '/api/user/change-phone/request',
      { phone, phoneCountryCode, phoneCountryIso },
      { baseURL: API_BASE },
    );
    return data;
  },

  /** Backend: POST /api/user/change-phone/verify { phone, otp, phoneCountryCode, phoneCountryIso } */
  async verifyPhoneChange(
    phone: string,
    otp: string,
    phoneCountryCode?: string,
    phoneCountryIso?: string,
  ): Promise<{ message: string; phone: string; isPhoneVerified: boolean }> {
    const { data } = await httpClient.post(
      '/api/user/change-phone/verify',
      { phone, otp, phoneCountryCode, phoneCountryIso },
      { baseURL: API_BASE },
    );
    return data;
  },

  /** Backend: POST /api/user/unlink-social { provider } */
  async unlinkSocial(provider: 'google' | 'apple' | 'facebook' | 'instagram'): Promise<{ message: string }> {
    const { data } = await httpClient.post(
      '/api/user/unlink-social',
      { provider },
      { baseURL: API_BASE },
    );
    return data;
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

  async blockUser(userId: string): Promise<{ blocked: boolean; message: string }> {
    const { data } = await httpClient.post<{ blocked?: boolean; message?: string }>(
      `/api/user/${userId}/block`,
      { action: 'block' },
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return {
      blocked: Boolean(body?.blocked),
      message: typeof body?.message === 'string' ? body.message : 'User blocked',
    };
  },

  async unblockUser(userId: string): Promise<{ blocked: boolean; message: string }> {
    const { data } = await httpClient.post<{ blocked?: boolean; message?: string }>(
      `/api/user/${userId}/block`,
      { action: 'unblock' },
      { baseURL: API_BASE },
    );
    const body = unwrap(data);
    return {
      blocked: Boolean(body?.blocked),
      message: typeof body?.message === 'string' ? body.message : 'User unblocked',
    };
  },

  /** Backend: GET /api/user/blocked?page=&limit=&q= */
  async getBlockedUsers(params: {
    page: number;
    limit: number;
    q?: string;
  }): Promise<BlockedUsersResponseDTO> {
    const { data } = await httpClient.get<BlockedUsersResponseDTO>('/api/user/blocked', {
      baseURL: API_BASE,
      params: {
        page: params.page,
        limit: params.limit,
        q: params.q || undefined,
      },
    });
    return data;
  },

  /** Backend: GET /api/user/search?q=&limit= */
  async searchUsers(q: string, limit = 20): Promise<UserSearchResponseDTO> {
    const { data } = await httpClient.get<UserSearchResponseDTO>('/api/user/search', {
      baseURL: API_BASE,
      params: { q, limit },
    });
    return { users: data.users ?? [] };
  },
};
