import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { ENV } from '../../constants/env';
import { storage } from '../../utils/storage';
import { API_ENDPOINTS } from '../../constants/appConstants';
import { RefreshTokenResponseDto } from '../dto/authDto';

export const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT_MS,
});

const refreshClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT_MS,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

const safeSerialize = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const maskAuth = (value: unknown) => {
  if (typeof value !== 'string' || value.length < 20) {
    return value;
  }
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
};

httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      config.headers.Cookie = `token=${accessToken}`;
    }
    // TEMP DEBUG LOGS: remove once API debugging is done.
    const authHeader =
      config.headers && 'Authorization' in config.headers
        ? maskAuth((config.headers as Record<string, unknown>).Authorization)
        : undefined;
    console.log(
      `[HTTP:REQUEST] ${String(config.method).toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}`,
      `\nheaders=${safeSerialize({ ...config.headers, Authorization: authHeader })}`,
      `\nparams=${safeSerialize(config.params)}`,
      `\ndata=${safeSerialize(config.data)}`,
    );
    return config;
  },
  async error => Promise.reject(error),
);

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await storage.getString(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const { data } = await refreshClient.post<RefreshTokenResponseDto>(
    API_ENDPOINTS.REFRESH_TOKEN,
    { refreshToken },
  );
  await storage.setString(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  await storage.setString(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  return data.accessToken;
};

httpClient.interceptors.response.use(
  response => {
    // TEMP DEBUG LOGS: remove once API debugging is done.
    console.log(
      `[HTTP:RESPONSE] ${response.status} ${String(response.config.method).toUpperCase()} ${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
      `\nresponse=${safeSerialize(response.data)}`,
    );
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshEndpoint = originalRequest?.url?.includes(API_ENDPOINTS.REFRESH_TOKEN);

    // TEMP DEBUG LOGS: remove once API debugging is done.
    console.log(
      `[HTTP:ERROR] ${status ?? 'NO_STATUS'} ${String(originalRequest?.method).toUpperCase()} ${originalRequest?.baseURL ?? ''}${originalRequest?.url ?? ''}`,
      `\nerror=${error.message}`,
      `\nresponse=${safeSerialize(error.response?.data)}`,
      `\nrequest-data=${safeSerialize(originalRequest?.data)}`,
    );

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const nextAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return httpClient(originalRequest);
      } catch {
        await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        await storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }


    const message = error.response?.data?.message ?? error.message ?? 'Unexpected network error';
    // Keep original Axios error shape so callers can read response.data/code.
    (error as AxiosError<{ message?: string }> & { message: string }).message = message;
    return Promise.reject(error);
  },
);
