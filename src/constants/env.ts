const normalize = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const devBaseUrl = normalize(process.env.PREELLY_API_BASE_URL_DEV);
const prodBaseUrl = normalize(process.env.PREELLY_API_BASE_URL_PROD);
const devWebBaseUrl = normalize(process.env.PREELLY_WEB_API_BASE_URL_DEV);
const prodWebBaseUrl = normalize(process.env.PREELLY_WEB_API_BASE_URL_PROD);

export const ENV = {
  API_BASE_URL:
    (__DEV__ ? devBaseUrl : prodBaseUrl) ??
    (__DEV__ ? 'http://117.254.196.100:5002' : 'http://117.254.196.100:5002'),
  WEB_API_BASE_URL:
    (__DEV__ ? devWebBaseUrl : prodWebBaseUrl) ??
    (__DEV__ ? 'http://117.254.196.100:3002' : 'http://117.254.196.100:3002'),
  API_TIMEOUT_MS: 12000,
} as const;
