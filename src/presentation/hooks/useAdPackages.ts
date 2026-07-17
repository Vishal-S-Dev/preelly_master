import { useCallback, useEffect, useState } from 'react';
import { PackageApi } from '../../data/api/PackageApi';
import { AdPackage } from '../../types/package.types';

export const useAdPackages = () => {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await PackageApi.getActivePackages();
      setPackages(list);
      const recommended = list.find(item => item.isRecommended);
      setSelectedId(prev => prev ?? recommended?.id ?? list[0]?.id ?? null);
    } catch {
      setError('Could not load packages. Please try again.');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPackage = packages.find(item => item.id === selectedId) ?? null;

  return {
    packages,
    loading,
    error,
    selectedId,
    selectedPackage,
    setSelectedId,
    reload: load,
  };
};
