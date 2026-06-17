import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SEARCH_CITIES } from '../../../constants/searchConstants';
import { SearchListingItem } from '../../../types/search.types';
import {
  SEARCH_SORT_OPTIONS,
  SearchFilterParams,
  SearchSortOption,
} from '../../../types/searchFilter.types';
import { FilterChip } from '../../components/search/FilterChip';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HeaderPill = memo<{
  label: string;
  icon?: string;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}>(({ label, icon, onPress, theme }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.headerPill,
        {
          backgroundColor: theme.background,
          borderColor: theme.subText + '22',
          shadowColor: '#000',
        },
        animStyle,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={theme.text} /> : null}
      <Text style={[styles.headerPillText, { color: theme.text }]}>{label}</Text>
    </AnimatedPressable>
  );
});

HeaderPill.displayName = 'HeaderPill';

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
  const sortSheetRef = useRef<BottomSheetModal>(null);

  const [filters, setFilters] = useState<SearchFilterParams>(() => mapRouteToFilters(route.params));
  const [sort, setSort] = useState<SearchSortOption>('newest');
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});

  const [draftCategoryId, setDraftCategoryId] = useState(filters.categoryId);
  const [draftCity, setDraftCity] = useState(filters.city ?? 'All Cities');
  const [draftMinPrice, setDraftMinPrice] = useState(
    filters.minPrice ? String(filters.minPrice) : '',
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    filters.maxPrice ? String(filters.maxPrice) : '',
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
      setDraftMinPrice(filters.minPrice ? String(filters.minPrice) : '');
      setDraftMaxPrice(filters.maxPrice ? String(filters.maxPrice) : '');
      setDraftYear(filters.year ?? '');
      setDraftMaxKm(filters.maxKilometers ?? '');
      filterSheetRef.current?.present();
    },
    [filters],
  );

  const applyFilters = useCallback(() => {
    const min = draftMinPrice.trim() ? Number(draftMinPrice) : undefined;
    const max = draftMaxPrice.trim() ? Number(draftMaxPrice) : undefined;
    setFilters(prev => ({
      ...prev,
      categoryId: draftCategoryId,
      city: draftCity,
      minPrice: Number.isFinite(min) ? min : undefined,
      maxPrice: Number.isFinite(max) ? max : undefined,
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
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftYear('');
    setDraftMaxKm('');
    filterSheetRef.current?.dismiss();
  }, [filters.keyword]);

  const handleSortSelect = useCallback((option: SearchSortOption) => {
    setSort(option);
    sortSheetRef.current?.dismiss();
  }, []);

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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.text} />
        </Pressable>

        <HeaderPill
          label="Filter"
          icon="tune-variant"
          onPress={openCategoryFilter}
          theme={theme}
        />
        <HeaderPill
          label="Sort"
          icon="sort"
          onPress={() => sortSheetRef.current?.present()}
          theme={theme}
        />

        <Pressable
          style={[styles.iconButton, { backgroundColor: theme.card, marginLeft: 'auto' }]}
          onPress={handleOpenSearch}
          accessibilityRole="button"
          accessibilityLabel="Open search"
          accessibilityHint="Returns to search screen"
        >
          <Icon name="magnify" size={22} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={SEARCH_CHIP_CONFIG}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        style={styles.chipListWrap}
        renderItem={({ item }) => (
          <FilterChip
            label={item.id === 'filter' && activeFilterCount > 0 ? `Filter (${activeFilterCount})` : item.label}
            selected={
              (item.id === 'region' && Boolean(filters.city && filters.city !== 'All Cities')) ||
              (item.id === 'price' && (Boolean(filters.minPrice) || Boolean(filters.maxPrice))) ||
              (item.id === 'year' && Boolean(filters.year)) ||
              (item.id === 'kilometres' && Boolean(filters.maxKilometers))
            }
            badgeCount={item.id === 'filter' ? activeFilterCount : undefined}
            onPress={() => openFilterSheet(item.id as typeof activeChip)}
          />
        )}
      />

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
                ? 'Price Range'
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
            <View style={styles.sheetSection}>
              <Text style={[styles.sheetLabel, { color: theme.subText }]}>Price (AED)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  value={draftMinPrice}
                  onChangeText={setDraftMinPrice}
                  placeholder="Min"
                  placeholderTextColor={theme.subText}
                  keyboardType="number-pad"
                  style={[styles.priceInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                />
                <Text style={{ color: theme.subText }}>—</Text>
                <TextInput
                  value={draftMaxPrice}
                  onChangeText={setDraftMaxPrice}
                  placeholder="Max"
                  placeholderTextColor={theme.subText}
                  keyboardType="number-pad"
                  style={[styles.priceInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                />
              </View>
            </View>
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

          {(activeChip === 'filter' || activeChip === 'year') && (
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

          {(activeChip === 'filter' || activeChip === 'kilometres') && (
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

      <BottomSheetModal
        ref={sortSheetRef}
        snapPoints={['42%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Sort By</Text>
          {SEARCH_SORT_OPTIONS.map(option => {
            const selected = sort === option.id;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.sortRow,
                  { borderBottomColor: theme.subText + '22' },
                  selected && { backgroundColor: theme.primary + '12' },
                ]}
                onPress={() => handleSortSelect(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.sortRowText, { color: selected ? theme.primary : theme.text }]}>
                  {option.label}
                </Text>
                {selected ? <Icon name="check" size={18} color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const SEARCH_CHIP_CONFIG = [
  { id: 'filter', label: 'Filter' },
  { id: 'region', label: 'Region' },
  { id: 'price', label: 'Price' },
  { id: 'kilometres', label: 'Kilometres' },
  { id: 'year', label: 'Year' },
] as const;

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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipListWrap: {
    maxHeight: 44,
    marginBottom: 8,
  },
  chipList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  resultHeader: {
    paddingHorizontal: SEARCH_RESULT_GRID_PADDING,
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  sortRowText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
