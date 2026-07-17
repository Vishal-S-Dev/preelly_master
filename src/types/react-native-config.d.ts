declare module 'react-native-config' {
  export interface NativeConfig {
    PREELLY_API_BASE_URL_DEV?: string;
    PREELLY_API_BASE_URL_PROD?: string;
    PREELLY_WEB_API_BASE_URL_DEV?: string;
    PREELLY_WEB_API_BASE_URL_PROD?: string;
    CCA_MERCHANT_ID?: string;
    CCA_ACCESS_CODE?: string;
    CCA_WORKING_KEY?: string;
    CCA_DEV_FALLBACK_ENABLED?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
