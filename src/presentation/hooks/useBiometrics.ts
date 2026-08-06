import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import ReactNativeBiometrics, { BiometryType } from 'react-native-biometrics';
import { storage } from '../../utils/storage';

const BIOMETRICS_ENABLED_KEY = 'preelly_biometrics_enabled';

const biometryLabel = (type?: BiometryType): string => {
  if (type === 'FaceID') return 'Face ID';
  if (type === 'TouchID') return 'Touch ID';
  if (type === 'Biometrics') return 'biometrics';
  return 'biometrics';
};

export const useBiometrics = () => {
  const rnBiometrics = useMemo(() => new ReactNativeBiometrics(), []);
  const [supported, setSupported] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType | undefined>(undefined);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ available, biometryType: type }, storedFlag] = await Promise.all([
          rnBiometrics.isSensorAvailable(),
          storage.getString(BIOMETRICS_ENABLED_KEY),
        ]);
        if (cancelled) {
          return;
        }
        setSupported(available);
        setBiometryType(type);
        setEnabled(available && storedFlag === 'true');
      } catch {
        if (!cancelled) {
          setSupported(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rnBiometrics]);

  const toggle = useCallback(
    async (next: boolean) => {
      if (!supported) {
        Alert.alert('Not available', "Biometric authentication isn't available on this device.");
        return;
      }
      setBusy(true);
      try {
        if (next) {
          const { success } = await rnBiometrics.simplePrompt({
            promptMessage: `Confirm with ${biometryLabel(biometryType)} to enable biometric login`,
          });
          if (!success) {
            return;
          }
        }
        await storage.setString(BIOMETRICS_ENABLED_KEY, next ? 'true' : 'false');
        setEnabled(next);
      } catch {
        Alert.alert('Unable to verify', 'Could not confirm your biometrics. Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [biometryType, rnBiometrics, supported],
  );

  return { supported, biometryType, enabled, loading, busy, toggle };
};
