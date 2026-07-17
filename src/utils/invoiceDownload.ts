import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Share } from 'react-native';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/appConstants';
import { ENV } from '../constants/env';
import { storage } from './storage';
import { PaymentApi } from '../data/api/PaymentApi';

const ensureDir = async (dir: string) => {
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
};

/**
 * Downloads invoice PDF to device storage.
 * Android: Downloads folder via RNFS (DownloadManager-compatible path).
 * iOS: Caches + Share sheet for Save/Open.
 * Returns local file path.
 */
export const downloadPaymentInvoiceFile = async (
  transactionId: string,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const meta = await PaymentApi.downloadInvoice(transactionId);
  const fileName = meta.fileName.endsWith('.pdf')
    ? meta.fileName
    : `${meta.fileName}.pdf`;

  const token = await storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  const isAbsolute = /^https?:\/\//i.test(meta.uri);
  const fromUrl = isAbsolute
    ? meta.uri
    : `${ENV.API_BASE_URL.replace(/\/$/, '')}${
        meta.uri.startsWith('/') ? meta.uri : `/${meta.uri}`
      }`;

  // Prefer absolute invoice URL when available from transaction.
  let downloadUrl = fromUrl;
  if (!isAbsolute) {
    try {
      const tx = await PaymentApi.getTransaction(transactionId);
      if (tx.invoice?.url && /^https?:\/\//i.test(tx.invoice.url)) {
        downloadUrl = tx.invoice.url;
      } else {
        downloadUrl = `${ENV.API_BASE_URL.replace(/\/$/, '')}${
          API_ENDPOINTS.PAYMENT_TRANSACTIONS
        }/${encodeURIComponent(transactionId)}/invoice`;
      }
    } catch {
      downloadUrl = `${ENV.API_BASE_URL.replace(/\/$/, '')}${
        API_ENDPOINTS.PAYMENT_TRANSACTIONS
      }/${encodeURIComponent(transactionId)}/invoice`;
    }
  }

  const dir =
    Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath
      : RNFS.DocumentDirectoryPath;

  await ensureDir(dir);
  const destPath = `${dir}/${fileName}`;

  const headers: Record<string, string> = {
    Accept: 'application/pdf,*/*',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const result = await RNFS.downloadFile({
    fromUrl: downloadUrl,
    toFile: destPath,
    headers,
    progressDivider: 5,
    begin: () => onProgress?.(0),
    progress: res => {
      if (res.contentLength > 0) {
        onProgress?.(
          Math.min(100, Math.round((res.bytesWritten / res.contentLength) * 100)),
        );
      }
    },
  }).promise;

  if (result.statusCode && result.statusCode >= 400) {
    throw new Error('Failed to download invoice. Please try again.');
  }

  onProgress?.(100);

  if (Platform.OS === 'ios') {
    await Share.share({
      url: `file://${destPath}`,
      title: fileName,
      message: 'Your Preelly invoice',
    });
  } else {
    // Android: file is in Downloads; share for open/share convenience.
    try {
      await Share.share({
        url: `file://${destPath}`,
        title: fileName,
        message: `Invoice saved to Downloads: ${fileName}`,
      });
    } catch {
      // Share is optional on Android once file is saved.
    }
  }

  return destPath;
};
