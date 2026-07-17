import { useCallback, useEffect, useState } from 'react';
import { StorageFacilityApi } from '../../data/api/StorageFacilityApi';
import { StorageFacility } from '../../types/checkout.types';

export const useStorageFacilities = (enabled: boolean) => {
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await StorageFacilityApi.getActiveFacilities();
      setFacilities(list);
      setLoadedOnce(true);
    } catch {
      setError('Could not load storage plans.');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSelectedId(null);
      return;
    }
    if (!loadedOnce) {
      load();
    }
  }, [enabled, load, loadedOnce]);

  const selectedFacility =
    facilities.find(item => item.id === selectedId) ?? null;

  return {
    facilities,
    loading,
    error,
    selectedId,
    selectedFacility,
    setSelectedId,
    reload: load,
  };
};
