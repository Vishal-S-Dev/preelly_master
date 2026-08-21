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
// Keys match the existing .env (WEB_CLIENT_ID / IOS_CLIENT_ID), not a GOOGLE_-prefixed name —
// these credentials (project 762845182720) were already provisioned for Google Sign-In.
const googleWebClientId = normalize(readEnv('WEB_CLIENT_ID'));
const googleIosClientId = normalize(readEnv('IOS_CLIENT_ID'));

export const ENV = {
  API_BASE_URL:
    (__DEV__ ? devBaseUrl : prodBaseUrl) ??
    (__DEV__
      ? 'https://beta.preelly.xyz/preelly-api'
      : 'https://beta.preelly.xyz/preelly-api'),
  WEB_API_BASE_URL:
    (__DEV__ ? devWebBaseUrl : prodWebBaseUrl) ??
    (__DEV__
      ? 'https://beta.preelly.xyz/preelly-api'
      : 'https://beta.preelly.xyz/preelly-api'),
  API_TIMEOUT_MS: 12000,
  /** OAuth 2.0 Web client ID — required by GoogleSignin.configure() to request an idToken. */
  GOOGLE_WEB_CLIENT_ID: googleWebClientId ?? '',
  /** iOS OAuth client ID — optional, only needed if it differs from the reversed URL scheme already in Info.plist. */
  GOOGLE_IOS_CLIENT_ID: googleIosClientId ?? '',
} as const;
