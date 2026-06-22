import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SEARCH_CITIES } from '../../../constants/searchConstants';
import {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
} from '../../../types/categoryFilter.types';
import { SearchListingItem } from '../../../types/search.types';
import {
  SEARCH_SORT_OPTIONS,
  SearchFilterParams,
  SearchSortOption,
} from '../../../types/searchFilter.types';
import { FilterChip } from '../../components/search/FilterChip';
import { PriceRangeSlider } from '../../components/filter/PriceRangeSlider';
import { SearchHeaderPill } from '../../components/search/SearchHeaderPill';
import {
  SEARCH_RESULT_GRID_GAP,
  SEARCH_RESULT_GRID_PADDING,
  SearchResultCard,
} from '../../components/search/SearchResultCard';
import { SearchFilterSkeleton } from '../../components/search/SearchFilterSkeleton';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useCategories } from '../../hooks/useCategories';
import {
  flattenSearchPages,
  getSearchTotal,
  useSearchProducts,
} from '../../hooks/useSearchProducts';
import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../hooks/useRedux';
import { saveProduct } from '../../redux/slices/productSlice';
import { PANEL_ANIMATION_MS, PANEL_HEIGHT } from '../../utils/searchMotion';
import { isMotorsCategory } from './categoryFilterUtils';

type PanelMode = 'none' | 'filter' | 'sort';

const SEARCH_CHIP_CONFIG = [
  { id: 'filter', label: 'Filter' },
  { id: 'region', label: 'Region' },
  { id: 'price', label: 'Price' },
  { id: 'kilometres', label: 'Kilometres' },
  { id: 'year', label: 'Year' },
] as const;

type FilterChipId = (typeof SEARCH_CHIP_CONFIG)[number]['id'];

const SORT_CHIP_LABELS: Record<SearchSortOption, string> = {
  newest: 'Newest to Oldest',
  price_desc: 'Price Highest to Lowest',
  price_asc: 'Price Lowest to Highest',
  popular: 'Most Popular',
};

const resolveResultLabel = (filters: SearchFilterParams): string => {
  if (filters.keyword?.trim()) {
    return filters.keyword.trim();
  }
  if (filters.subCategoryName?.trim()) {
    return filters.subCategoryName.trim();
  }
  if (filters.categoryName?.trim()) {
    return filters.categoryName.trim();
  }
  return 'Listings';
};

const countActiveFilters = (filters: SearchFilterParams): number => {
  let count = 0;
  if (filters.categoryId) count += 1;
  if (filters.subCategoryId) count += 1;
  if (filters.city && filters.city !== 'All Cities') count += 1;
  if (filters.emirates?.length) count += 1;
  if (typeof filters.minPrice === 'number' && filters.minPrice > 0) count += 1;
  if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0) count += 1;
  if (filters.year?.trim() || filters.yearFrom?.trim() || filters.yearTo?.trim()) count += 1;
  if (filters.maxKilometers?.trim() || typeof filters.minKilometers === 'number') count += 1;
  if (filters.makeModelId) count += 1;
  if (filters.trimId) count += 1;
  if (filters.dynamicFilters && Object.keys(filters.dynamicFilters).length > 0) count += 1;
  return count;
};

const mapRouteToFilters = (params: RootStackParamList['SearchFilter']): SearchFilterParams => ({
  keyword: params?.keyword,
  city: params?.city,
  categoryId: params?.categoryId,
  subCategoryId: params?.subCategoryId,
  categoryName: params?.categoryName,
  subCategoryName: params?.subCategoryName,
  minPrice: params?.minPrice,
  maxPrice: params?.maxPrice,
  year: params?.year,
  yearFrom: params?.yearFrom,
  yearTo: params?.yearTo,
  maxKilometers: params?.maxKilometers,
  minKilometers: params?.minKilometers,
  makeModelId: params?.makeModelId,
  trimId: params?.trimId,
  emirates: params?.emirates,
  dynamicFilters: params?.dynamicFilters,
});

export const SearchResultScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SearchFilter'>>();
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const panelProgress = useSharedValue(0);

  const [filters, setFilters] = useState<SearchFilterParams>(() => mapRouteToFilters(route.params));
  const [sort, setSort] = useState<SearchSortOption>('newest');
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const [panelMode, setPanelMode] = useState<PanelMode>('none');

  const [draftCategoryId, setDraftCategoryId] = useState(filters.categoryId);
  const [draftCity, setDraftCity] = useState(filters.city ?? 'All Cities');
  const [draftMinPrice, setDraftMinPrice] = useState(
    filters.minPrice ?? DEFAULT_PRICE_MIN,
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    filters.maxPrice ?? DEFAULT_PRICE_MAX,
  );
  const [draftYear, setDraftYear] = useState(filters.year ?? '');
  const [draftMaxKm, setDraftMaxKm] = useState(filters.maxKilometers ?? '');

  const [activeChip, setActiveChip] = useState<
    'filter' | 'region' | 'price' | 'kilometres' | 'year' | null
  >(null);

  useEffect(() => {
    setFilters(mapRouteToFilters(route.params));
  }, [route.params]);

  const openCategoryFilter = useCallback(() => {
    navigation.navigate('CategoryFilter', {
      categoryId: filters.categoryId,
      categoryName: filters.categoryName,
      keyword: filters.keyword,
      selectedFilters: {
        searchKeyword: filters.keyword,
        emirates: filters.emirates ?? [],
        emirateNames: filters.city ? [filters.city] : [],
        categoryId: filters.categoryId ?? '',
        categoryName: filters.categoryName ?? '',
        subCategoryId: filters.subCategoryId ?? '',
        subCategoryName: filters.subCategoryName ?? '',
        makeModelId: filters.makeModelId,
        trimId: filters.trimId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        minKilometers: filters.minKilometers,
        maxKilometers: filters.maxKilometers ? Number(filters.maxKilometers) : undefined,
        filters: filters.dynamicFilters ?? {},
      },
    });
  }, [filters, navigation]);

  const searchQuery = useSearchProducts(filters, sort);
  const { data: rootCategories = [] } = useCategories();
  const products = useMemo(() => {
    const flat = flattenSearchPages(searchQuery.data?.pages);
    return flat.map(item => ({
      ...item,
      isSaved: savedOverrides[item.id] ?? item.isSaved,
    }));
  }, [savedOverrides, searchQuery.data?.pages]);

  const total = getSearchTotal(searchQuery.data?.pages);
  const resultLabel = resolveResultLabel(filters);
  const activeFilterCount = countActiveFilters(filters);

  const isMotors = useMemo(() => {
    if (isMotorsCategory(filters.categoryName)) {
      return true;
    }
    if (filters.categoryId) {
      const category = rootCategories.find(item => item._id === filters.categoryId);
      return isMotorsCategory(category?.name);
    }
    return false;
  }, [filters.categoryId, filters.categoryName, rootCategories]);

  const visibleFilterChips = useMemo(
    () =>
      SEARCH_CHIP_CONFIG.filter(chip => {
        if (chip.id === 'kilometres' || chip.id === 'year') {
          return isMotors;
        }
        return true;
      }),
    [isMotors],
  );

  const isInitialLoading = searchQuery.isLoading && products.length === 0;
  const isRefreshing = searchQuery.isRefetching && !searchQuery.isFetchingNextPage;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    [],
  );

  const openFilterSheet = useCallback(
    (chip: typeof activeChip) => {
      setActiveChip(chip);
      setDraftCategoryId(filters.categoryId);
      setDraftCity(filters.city ?? 'All Cities');
      setDraftMinPrice(filters.minPrice ?? DEFAULT_PRICE_MIN);
      setDraftMaxPrice(filters.maxPrice ?? DEFAULT_PRICE_MAX);
      setDraftYear(filters.year ?? '');
      setDraftMaxKm(filters.maxKilometers ?? '');
      filterSheetRef.current?.present();
    },
    [filters],
  );

  const applyFilters = useCallback(() => {
    const min = draftMinPrice;
    const max = draftMaxPrice;
    setFilters(prev => ({
      ...prev,
      categoryId: draftCategoryId,
      city: draftCity,
      minPrice: min !== DEFAULT_PRICE_MIN ? min : undefined,
      maxPrice: max !== DEFAULT_PRICE_MAX ? max : undefined,
      year: draftYear.trim() || undefined,
      maxKilometers: draftMaxKm.trim() || undefined,
    }));
    filterSheetRef.current?.dismiss();
  }, [draftCategoryId, draftCity, draftMaxKm, draftMaxPrice, draftMinPrice, draftYear]);

  const resetFilters = useCallback(() => {
    setFilters({
      keyword: filters.keyword,
    });
    setDraftCategoryId(undefined);
    setDraftCity('All Cities');
    setDraftMinPrice(DEFAULT_PRICE_MIN);
    setDraftMaxPrice(DEFAULT_PRICE_MAX);
    setDraftYear('');
    setDraftMaxKm('');
    filterSheetRef.current?.dismiss();
  }, [filters.keyword]);

  const closePanel = useCallback(() => {
    panelProgress.value = withTiming(0, { duration: 200 }, finished => {
      if (finished) {
        runOnJS(setPanelMode)('none');
      }
    });
  }, [panelProgress]);

  const handleSortSelect = useCallback(
    (option: SearchSortOption) => {
      setSort(option);
      closePanel();
    },
    [closePanel],
  );

  const toggleFilterPanel = useCallback(() => {
    if (panelMode === 'filter') {
      closePanel();
      return;
    }
    if (panelMode === 'sort') {
      setPanelMode('filter');
      return;
    }
    setPanelMode('filter');
    panelProgress.value = withTiming(1, { duration: PANEL_ANIMATION_MS });
  }, [closePanel, panelMode, panelProgress]);

  const toggleSortPanel = useCallback(() => {
    if (panelMode === 'sort') {
      closePanel();
      return;
    }
    if (panelMode === 'filter') {
      setPanelMode('sort');
      return;
    }
    setPanelMode('sort');
    panelProgress.value = withTiming(1, { duration: PANEL_ANIMATION_MS });
  }, [closePanel, panelMode, panelProgress]);

  const handleFilterChipPress = useCallback(
    (chipId: FilterChipId) => {
      if (chipId === 'filter') {
        openCategoryFilter();
        return;
      }
      openFilterSheet(chipId);
    },
    [openCategoryFilter, openFilterSheet],
  );

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(panelProgress.value, [0, 1], [0, PANEL_HEIGHT]),
    opacity: interpolate(panelProgress.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(panelProgress.value, [0, 1], [-10, 0]) }],
  }));

  const handleRefresh = useCallback(() => {
    searchQuery.refetch();
  }, [searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage();
    }
  }, [searchQuery]);

  const handleOpenProduct = useCallback(
    (item: SearchListingItem) => {
      navigation.navigate('ProductDetail', { productId: item.id });
    },
    [navigation],
  );

  const handleFavorite = useCallback(
    (item: SearchListingItem) => {
      const nextSaved = !(savedOverrides[item.id] ?? item.isSaved);
      setSavedOverrides(prev => ({ ...prev, [item.id]: nextSaved }));
      dispatch(saveProduct(item.id));
    },
    [dispatch, savedOverrides],
  );

  const handleOpenSearch = useCallback(() => {
    navigation.navigate('Search', { initialQuery: filters.keyword });
  }, [filters.keyword, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: SearchListingItem }) => (
      <SearchResultCard item={item} onPress={handleOpenProduct} onFavorite={handleFavorite} />
    ),
    [handleFavorite, handleOpenProduct],
  );

  const keyExtractor = useCallback((item: SearchListingItem) => item.id, []);

  const filterChipSelected = useCallback(
    (chipId: FilterChipId) => {
      if (chipId === 'region') {
        return Boolean(filters.city && filters.city !== 'All Cities');
      }
      if (chipId === 'price') {
        return Boolean(filters.minPrice) || Boolean(filters.maxPrice);
      }
      if (chipId === 'year') {
        return Boolean(filters.year);
      }
      if (chipId === 'kilometres') {
        return Boolean(filters.maxKilometers);
      }
      return activeFilterCount > 0;
    },
    [activeFilterCount, filters],
  );

  const renderFilterPanel = useMemo(
    () => (
      <FlatList
        data={visibleFilterChips}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <FilterChip
            label={
              item.id === 'filter' && activeFilterCount > 0
                ? `Filter (${activeFilterCount})`
                : item.label
            }
            icon={item.id === 'filter' ? 'tune-variant' : undefined}
            variant="outline"
            selected={filterChipSelected(item.id)}
            badgeCount={item.id === 'filter' ? activeFilterCount : undefined}
            onPress={() => handleFilterChipPress(item.id)}
            accessibilityHint={
              item.id === 'filter'
                ? 'Opens full category filter screen'
                : `Opens ${item.label} filter options`
            }
          />
        )}
      />
    ),
    [activeFilterCount, filterChipSelected, handleFilterChipPress, visibleFilterChips],
  );

  const renderSortPanel = useMemo(
    () => (
      <FlatList
        data={SEARCH_SORT_OPTIONS}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <FilterChip
            label={SORT_CHIP_LABELS[item.id]}
            variant="outline"
            selected={sort === item.id}
            onPress={() => handleSortSelect(item.id)}
            accessibilityHint={`Sort results by ${item.label}`}
          />
        )}
      />
    ),
    [handleSortSelect, sort],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.resultHeader}>
        <Text style={[styles.resultTitle, { color: theme.text }]}>
          Search result for "{resultLabel}"
        </Text>
        <Text style={[styles.resultCount, { color: theme.subText }]}>
          {total.toLocaleString()} results
        </Text>
      </View>
    ),
    [resultLabel, theme.subText, theme.text, total],
  );

  const listEmpty = useMemo(() => {
    if (isInitialLoading) {
      return null;
    }
    return (
      <View style={styles.emptyWrap}>
        <Icon name="package-variant-closed" size={56} color={theme.subText} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No products found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
          Try changing filters or search keyword.
        </Text>
        <Pressable
          style={[styles.resetBtn, { backgroundColor: theme.primary }]}
          onPress={resetFilters}
          accessibilityRole="button"
          accessibilityLabel="Reset filters"
        >
          <Text style={styles.resetBtnText}>Reset Filters</Text>
        </Pressable>
      </View>
    );
  }, [isInitialLoading, resetFilters, theme.primary, theme.subText, theme.text]);

  const listFooter = useMemo(
    () =>
      searchQuery.isFetchingNextPage ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <View style={styles.footerSpacer} />
      ),
    [searchQuery.isFetchingNextPage, theme.primary],
  );

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <SearchFilterSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={() => navigation.goBack()}
          android_ripple={{ color: theme.subText + '33', borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.text} />
        </Pressable>

        <View style={styles.headerPills}>
          <SearchHeaderPill
            label="Filter"
            icon="tune-variant"
            active={panelMode === 'filter'}
            badgeCount={activeFilterCount > 0 ? activeFilterCount : undefined}
            onPress={toggleFilterPanel}
            accessibilityHint="Toggle filter options panel"
          />
          <SearchHeaderPill
            label="Sort"
            icon="sort"
            active={panelMode === 'sort'}
            onPress={toggleSortPanel}
            accessibilityHint="Toggle sort options panel"
          />
        </View>

        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={handleOpenSearch}
          android_ripple={{ color: theme.subText + '33', borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="Open search"
          accessibilityHint="Returns to search screen"
        >
          <Icon name="magnify" size={22} color={theme.text} />
        </Pressable>
      </View>

      <Animated.View style={[styles.panelContainer, panelAnimatedStyle]}>
        {panelMode === 'filter' ? renderFilterPanel : null}
        {panelMode === 'sort' ? renderSortPanel : null}
      </Animated.View>

      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={products.length ? styles.gridRow : undefined}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />

      <BottomSheetModal
        ref={filterSheetRef}
        snapPoints={['72%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            {activeChip === 'region'
              ? 'Region'
              : activeChip === 'price'
                ? ''
                : activeChip === 'year'
                  ? 'Year'
                  : activeChip === 'kilometres'
                    ? 'Kilometres'
                    : 'Filters'}
          </Text>

          {(activeChip === 'filter' || activeChip === 'region') && (
            <View style={styles.sheetSection}>
              <Text style={[styles.sheetLabel, { color: theme.subText }]}>City</Text>
              <View style={styles.optionWrap}>
                {SEARCH_CITIES.map(city => {
                  const selected = draftCity === city;
                  return (
                    <Pressable
                      key={city}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selected ? theme.primary : theme.card,
                          borderColor: selected ? theme.primary : theme.subText + '33',
                        },
                      ]}
                      onPress={() => setDraftCity(city)}
                    >
                      <Text style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '600' }}>
                        {city}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {(activeChip === 'filter' || activeChip === 'price') && (
            <PriceRangeSlider
              minValue={draftMinPrice}
              maxValue={draftMaxPrice}
              onChangeMin={setDraftMinPrice}
              onChangeMax={setDraftMaxPrice}
            />
          )}

          {activeChip === 'filter' && (
            <View style={styles.sheetSection}>
              <Text style={[styles.sheetLabel, { color: theme.subText }]}>Category</Text>
              <View style={styles.optionWrap}>
                {rootCategories.map(category => {
                  const selected = draftCategoryId === category._id;
                  return (
                    <Pressable
                      key={category._id}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selected ? theme.primary : theme.card,
                          borderColor: selected ? theme.primary : theme.subText + '33',
                        },
                      ]}
                      onPress={() => setDraftCategoryId(category._id)}
                    >
                      <Text style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '600' }}>
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {isMotors && (activeChip === 'filter' || activeChip === 'year') && (
            <View style={styles.sheetSection}>
              <Text style={[styles.sheetLabel, { color: theme.subText }]}>Year</Text>
              <TextInput
                value={draftYear}
                onChangeText={setDraftYear}
                placeholder="e.g. 2022"
                placeholderTextColor={theme.subText}
                keyboardType="number-pad"
                style={[styles.fullInput, { color: theme.text, borderColor: theme.subText + '33' }]}
              />
            </View>
          )}

          {isMotors && (activeChip === 'filter' || activeChip === 'kilometres') && (
            <View style={styles.sheetSection}>
              <Text style={[styles.sheetLabel, { color: theme.subText }]}>Max Kilometres</Text>
              <TextInput
                value={draftMaxKm}
                onChangeText={setDraftMaxKm}
                placeholder="e.g. 100000"
                placeholderTextColor={theme.subText}
                keyboardType="number-pad"
                style={[styles.fullInput, { color: theme.text, borderColor: theme.subText + '33' }]}
              />
            </View>
          )}

          <View style={styles.sheetActions}>
            <Pressable
              style={[styles.sheetSecondaryBtn, { borderColor: theme.subText + '44' }]}
              onPress={resetFilters}
            >
              <Text style={[styles.sheetSecondaryText, { color: theme.text }]}>Reset</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetPrimaryBtn, { backgroundColor: theme.primary }]}
              onPress={applyFilters}
            >
              <Text style={styles.sheetPrimaryText}>Apply Filters</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  headerPills: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContainer: {
    overflow: 'hidden',
  },
  chipList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  resultHeader: {
    paddingHorizontal: 16,//SEARCH_RESULT_GRID_PADDING,
    paddingBottom: 12,

    gap: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  gridContent: {
    paddingHorizontal: SEARCH_RESULT_GRID_PADDING,
    paddingBottom: 24,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: SEARCH_RESULT_GRID_GAP,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerSpacer: {
    height: 12,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheetSection: {
    marginBottom: 18,
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  fullInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  sheetSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetSecondaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
  sheetPrimaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
