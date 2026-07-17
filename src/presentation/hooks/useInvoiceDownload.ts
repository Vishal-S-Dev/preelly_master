import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { paymentService } from '../../services/payment.service';
import { getPaymentErrorMessage } from '../../utils/paymentUtils';

export const useInvoiceDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const download = useCallback(async (transactionId: string) => {
    setDownloading(true);
    setProgress(0);
    try {
      const path = await paymentService.downloadInvoice(transactionId);
      Alert.alert('Invoice ready', 'Your invoice has been saved.');
      return path;
    } catch (error) {
      Alert.alert('Download failed', getPaymentErrorMessage(error));
      throw error;
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }, []);

  return { downloading, progress, download, setProgress };
};
