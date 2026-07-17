import Config from 'react-native-config';

const readEnv = (key: string): string | null => {
  const fromConfig = Config[key as keyof typeof Config];
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }
  const fromProcess = process.env[key];
  if (typeof fromProcess === 'string' && fromProcess.trim()) {
    return fromProcess.trim();
  }
  return null;
};

const isTruthy = (value: string | null): boolean =>
  value === '1' || value?.toLowerCase() === 'true';

/**
 * DEV-only CCAvenue credentials from `.env` (gitignored).
 * Remove before production — production must receive encrypted session from backend API only.
 */
export const CCAVENUE_ENV = {
  merchantId: readEnv('CCA_MERCHANT_ID'),
  accessCode: readEnv('CCA_ACCESS_CODE'),
  workingKey: readEnv('CCA_WORKING_KEY'),
  devFallbackEnabled:
    __DEV__ && isTruthy(readEnv('CCA_DEV_FALLBACK_ENABLED') ?? 'true'),
} as const;

export const hasDevCcavenueCredentials = (): boolean =>
  Boolean(
    CCAVENUE_ENV.devFallbackEnabled &&
      CCAVENUE_ENV.merchantId &&
      CCAVENUE_ENV.accessCode &&
      CCAVENUE_ENV.workingKey,
  );

/**
 * Merged into POST /api/payment/initiate body in __DEV__ only.
 * Sends common key aliases so backend can pick up credentials during testing.
 */
export const getDevCcavenueInitiateOverrides = (): Record<string, string> => {
  if (!hasDevCcavenueCredentials()) {
    return {};
  }

  const { merchantId, accessCode, workingKey } = CCAVENUE_ENV;
  return {
    merchantId: merchantId!,
    accessCode: accessCode!,
    workingKey: workingKey!,
    ccaMerchantId: merchantId!,
    ccaAccessCode: accessCode!,
    ccaWorkingKey: workingKey!,
    CCA_MERCHANT_ID: merchantId!,
    CCA_ACCESS_CODE: accessCode!,
    CCA_WORKING_KEY: workingKey!,
  };
};

/** Redact CCA secrets before logging HTTP payloads. */
export const redactCcavenueFields = (
  data: unknown,
): unknown => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const sensitive = new Set([
    'workingKey',
    'ccaWorkingKey',
    'CCA_WORKING_KEY',
    'accessCode',
    'ccaAccessCode',
    'CCA_ACCESS_CODE',
  ]);
  const clone = { ...(data as Record<string, unknown>) };
  Object.keys(clone).forEach(key => {
    if (sensitive.has(key) && typeof clone[key] === 'string') {
      clone[key] = '***REDACTED***';
    }
  });
  return clone;
};
