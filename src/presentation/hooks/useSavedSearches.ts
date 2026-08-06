import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductApi } from '../../data/api/ProductApi';
import { SavedSearchApi } from '../../data/api/SavedSearchApi';
import { SavedSearchDTO, SavedSearchListing, SavedSearchTab } from '../../types/savedSearch.types';

const ALL_TAB: SavedSearchTab = { key: 'all', label: 'All', count: 0 };

const formatSavedDate = (value?: string): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const getFilterTags = (dto: SavedSearchDTO): string[] => {
  if (dto.filters?.tags?.length) {
    return dto.filters.tags;
  }
  const tags: string[] = [];
  const location = dto.location || dto.filters?.location;
  tags.push(location ? location.toUpperCase() : 'ALL CITIES');
  if (dto.filters?.minPrice || dto.filters?.maxPrice) {
    tags.push(`PRICE: ${dto.filters?.minPrice || '0'}–${dto.filters?.maxPrice || '∞'}`);
  }
  return tags;
};

const mapSavedSearch = (dto: SavedSearchDTO): SavedSearchListing => {
  const pathNames = dto.categoryPath?.filter(Boolean) ?? [];
  const breadcrumb = pathNames.length
    ? pathNames.join(' > ')
    : [dto.categoryName, dto.subCategoryName].filter(Boolean).join(' > ') || null;

  return {
    id: dto._id,
    breadcrumb,
    title: dto.searchName?.trim() || dto.title?.trim() || 'My Search',
    matchCount: typeof dto.matchCount === 'number' ? dto.matchCount : null,
    newAdsCount: dto.newAdsCount ?? 0,
    tags: getFilterTags(dto),
    previewImages: (dto.previewImages ?? []).slice(0, 3).map(src => ProductApi.withBase(src)),
    savedOnLabel: formatSavedDate(dto.createdAt),
    notifyEnabled: Boolean(dto.notificationEnabled ?? dto.notifyEnabled),
    rootCategoryLabel: pathNames[0] || dto.categoryName || 'Other',
    reopenParams: {
      keyword: dto.keyword?.trim() || dto.query?.trim() || undefined,
      categoryId: dto.categoryId ?? undefined,
      categoryName: dto.categoryName || undefined,
      subCategoryId: dto.subCategoryId ?? undefined,
      subCategoryName: dto.subCategoryName || undefined,
      city: dto.filters?.location || dto.location || undefined,
      minPrice: dto.filters?.minPrice ? Number(dto.filters.minPrice) : undefined,
      maxPrice: dto.filters?.maxPrice ? Number(dto.filters.maxPrice) : undefined,
    },
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) {
      return response.data.message.trim();
    }
  }
  return fallback;
};

export const useSavedSearches = () => {
  const [items, setItems] = useState<SavedSearchListing[]>([]);
  const [tabs, setTabs] = useState<SavedSearchTab[]>([ALL_TAB]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await SavedSearchApi.getSavedSearches();
      setItems(response.savedSearches.map(mapSavedSearch));
      setTabs(response.tabs?.length ? response.tabs : [ALL_TAB]);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load saved searches'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') {
      return items;
    }
    const tab = tabs.find(t => t.key === activeTab);
    if (!tab || tab.key === 'all') {
      return items;
    }
    return items.filter(item => item.rootCategoryLabel === tab.label);
  }, [activeTab, items, tabs]);

  const open = useCallback((id: string) => {
    SavedSearchApi.updateSavedSearch(id, { markViewed: true }).catch(() => undefined);
    setItems(prev => prev.map(item => (item.id === id ? { ...item, newAdsCount: 0 } : item)));
  }, []);

  const toggleNotify = useCallback(
    (id: string) => {
      const current = items.find(item => item.id === id);
      if (!current) {
        return;
      }
      const nextEnabled = !current.notifyEnabled;
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, notifyEnabled: nextEnabled } : item)),
      );
      SavedSearchApi.updateSavedSearch(id, { notificationEnabled: nextEnabled }).catch(() => {
        setItems(prev =>
          prev.map(item => (item.id === id ? { ...item, notifyEnabled: current.notifyEnabled } : item)),
        );
      });
    },
    [items],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    setBusyId(id);
    try {
      await SavedSearchApi.deleteSavedSearch(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setTabs(() => {
        const next = items.filter(item => item.id !== id);
        const counts = new Map<string, number>();
        next.forEach(item => counts.set(item.rootCategoryLabel, (counts.get(item.rootCategoryLabel) ?? 0) + 1));
        return [
          { key: 'all', label: 'All', count: next.length },
          ...Array.from(counts.entries()).map(([label, count]) => ({
            key: label.toLowerCase().replace(/\s+/g, '-'),
            label,
            count,
          })),
        ];
      });
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to delete saved search'));
    } finally {
      setBusyId(null);
    }
  }, [items]);

  return useMemo(
    () => ({
      items: filteredItems,
      tabs,
      activeTab,
      setActiveTab,
      loading,
      refreshing,
      error,
      busyId,
      refresh,
      open,
      toggleNotify,
      remove,
      reload: () => load('initial'),
    }),
    [activeTab, busyId, error, filteredItems, load, loading, open, refresh, refreshing, remove, tabs, toggleNotify],
  );
};
