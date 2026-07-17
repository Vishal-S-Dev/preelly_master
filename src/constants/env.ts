import Config from 'react-native-config';

const normalize = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readEnv = (key: string): string | undefined => {
  const fromConfig = Config[key as keyof typeof Config];
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }
  const fromProcess = process.env[key];
  if (typeof fromProcess === 'string' && fromProcess.trim()) {
    return fromProcess.trim();
  }
  return undefined;
};

const devBaseUrl = normalize(readEnv('PREELLY_API_BASE_URL_DEV'));
const prodBaseUrl = normalize(readEnv('PREELLY_API_BASE_URL_PROD'));
const devWebBaseUrl = normalize(readEnv('PREELLY_WEB_API_BASE_URL_DEV'));
const prodWebBaseUrl = normalize(readEnv('PREELLY_WEB_API_BASE_URL_PROD'));

export const ENV = {
  API_BASE_URL:
    (__DEV__ ? devBaseUrl : prodBaseUrl) ??
    (__DEV__ ? 'http://117.254.196.100:8029' : 'http://117.254.196.100:8029'),
  WEB_API_BASE_URL:
    (__DEV__ ? devWebBaseUrl : prodWebBaseUrl) ??
    (__DEV__ ? 'http://117.254.196.100:8029' : 'http://117.254.196.100:8029'),
  API_TIMEOUT_MS: 12000,
} as const;
