import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  CategoryFilterPayload,
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
} from '../../../types/categoryFilter.types';
import { Category } from '../../../types/category.types';
import { isPropertyCategory } from '../../../utils/isPropertyCategory';
import {
  PropertySubcategoryAccordion,
  PropertySubcategorySelection,
} from '../../components/createPost/PropertySubcategoryAccordion';
import { SubcategoryListSkeleton } from '../../components/createPost/SubcategoryListSkeleton';
import { CategoryGrid } from '../../components/search/CategoryGrid';
import { CategoryFilterSkeleton } from '../../components/filter/CategoryFilterSkeleton';
import { DynamicFilterRenderer } from '../../components/filter/DynamicFilterRenderer';
import { EmirateFilterChips } from '../../components/filter/EmirateFilterChips';
import {
  FilterDropdown,
  mapCategoriesToDropdownOptions,
} from '../../components/filter/FilterDropdown';
import { PriceRangeSlider } from '../../components/filter/PriceRangeSlider';
import { SubCategoryChip, subCategoryStyles } from '../../components/filter/SubCategoryChip';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useDynamicFilters } from '../../hooks/useDynamicFilters';
import { useEmirates } from '../../hooks/useEmirates';
import { usePropertyCategories } from '../../hooks/usePropertyCategories';
import { useSubcategories } from '../../hooks/useSubcategories';
import { RootStackParamList } from '../../navigation/types';
import { isMotorsCategory, payloadToSearchFilters } from './categoryFilterUtils';

export const CategoryFilterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CategoryFilter'>>();
  const theme = useAppTheme();

  const initial = route.params?.selectedFilters;

  const [searchKeyword, setSearchKeyword] = useState(
    initial?.searchKeyword ?? route.params?.keyword ?? '',
  );
  const [selectedEmirates, setSelectedEmirates] = useState<string[]>(initial?.emirates ?? []);
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? route.params?.categoryId ?? '',
  );
  const [categoryName, setCategoryName] = useState(
    initial?.categoryName ?? route.params?.categoryName ?? '',
  );
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId ?? '');
  const [subCategoryName, setSubCategoryName] = useState(initial?.subCategoryName ?? '');
  const [makeModelId, setMakeModelId] = useState(initial?.makeModelId ?? '');
  const [makeModelName, setMakeModelName] = useState(initial?.makeModelName ?? '');
  const [trimId, setTrimId] = useState(initial?.trimId ?? '');
  const [trimName, setTrimName] = useState(initial?.trimName ?? '');
  const [minPrice, setMinPrice] = useState(initial?.minPrice ?? DEFAULT_PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? DEFAULT_PRICE_MAX);
  const [yearFrom, setYearFrom] = useState(initial?.yearFrom ?? '');
  const [yearTo, setYearTo] = useState(initial?.yearTo ?? '');
  const [minKm, setMinKm] = useState(
    initial?.minKilometers != null ? String(initial.minKilometers) : '',
  );
  const [maxKm, setMaxKm] = useState(
    initial?.maxKilometers != null ? String(initial.maxKilometers) : '',
  );
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | string[]>>(
    initial?.filters ?? {},
  );
  const [expandedPropertyCategoryId, setExpandedPropertyCategoryId] = useState<string | null>(null);

  const isProperty = isPropertyCategory(categoryName);

  const emiratesQuery = useEmirates();
  const subcategoriesQuery = useSubcategories(isProperty ? undefined : categoryId || undefined);
  const propertyCategoriesQuery = usePropertyCategories(isProperty && Boolean(categoryId));
  const makeModelsQuery = useSubcategories(
    isMotorsCategory(categoryName) && subCategoryId ? subCategoryId : undefined,
  );
  const trimsQuery = useSubcategories(
    isMotorsCategory(categoryName) && makeModelId ? makeModelId : undefined,
  );
  const dynamicFiltersQuery = useDynamicFilters(subCategoryId || undefined);

  const emirates = emiratesQuery.data ?? [];
  const emirateNameMap = useMemo(
    () => new Map(emirates.map(item => [item._id, item.name])),
    [emirates],
  );

  const isInitialLoading = emiratesQuery.isLoading && !emirates.length;

  const handleCategorySelect = useCallback((id: string, name: string) => {
    setCategoryId(id);
    setCategoryName(name);
    setSubCategoryId('');
    setSubCategoryName('');
    setExpandedPropertyCategoryId(null);
    setMakeModelId('');
    setMakeModelName('');
    setTrimId('');
    setTrimName('');
    setDynamicValues({});
  }, []);

  const handleSubcategorySelect = useCallback(
    (id: string, name: string) => {
      setSubCategoryId(id);
      setSubCategoryName(name);
      setMakeModelId('');
      setMakeModelName('');
      setTrimId('');
      setTrimName('');
      setDynamicValues({});
    },
    [],
  );

  const onTogglePropertyExpand = useCallback((parentId: string) => {
    setExpandedPropertyCategoryId(prev => (prev === parentId ? null : parentId));
  }, []);

  const onSelectPropertySubcategory = useCallback(
    (selection: PropertySubcategorySelection) => {
      handleSubcategorySelect(selection.subcategoryId, selection.name);
    },
    [handleSubcategorySelect],
  );

  const handleDynamicChange = useCallback((fieldKey: string, value: string | string[]) => {
    setDynamicValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const buildPayload = useCallback((): CategoryFilterPayload => {
    const emirateNames = selectedEmirates
      .map(id => emirateNameMap.get(id))
      .filter((name): name is string => Boolean(name));

    return {
      emirates: selectedEmirates,
      emirateNames,
      categoryId,
      categoryName,
      subCategoryId,
      subCategoryName,
      makeModelId: makeModelId || undefined,
      makeModelName: makeModelName || undefined,
      trimId: trimId || undefined,
      trimName: trimName || undefined,
      minPrice,
      maxPrice,
      yearFrom: yearFrom.trim() || undefined,
      yearTo: yearTo.trim() || undefined,
      minKilometers: minKm.trim() ? Number(minKm) : undefined,
      maxKilometers: maxKm.trim() ? Number(maxKm) : undefined,
      searchKeyword: searchKeyword.trim() || undefined,
      filters: dynamicValues,
    };
  }, [
    categoryId,
    categoryName,
    dynamicValues,
    emirateNameMap,
    makeModelId,
    makeModelName,
    maxKm,
    maxPrice,
    minKm,
    minPrice,
    searchKeyword,
    selectedEmirates,
    subCategoryId,
    subCategoryName,
    trimId,
    trimName,
    yearFrom,
    yearTo,
  ]);

  const handleClear = useCallback(() => {
    setSearchKeyword(route.params?.keyword ?? '');
    setSelectedEmirates([]);
    setCategoryId(route.params?.categoryId ?? '');
    setCategoryName(route.params?.categoryName ?? '');
    setSubCategoryId('');
    setSubCategoryName('');
    setExpandedPropertyCategoryId(null);
    setMakeModelId('');
    setMakeModelName('');
    setTrimId('');
    setTrimName('');
    setMinPrice(DEFAULT_PRICE_MIN);
    setMaxPrice(DEFAULT_PRICE_MAX);
    setYearFrom('');
    setYearTo('');
    setMinKm('');
    setMaxKm('');
    setDynamicValues({});
  }, [route.params?.categoryId, route.params?.categoryName, route.params?.keyword]);

  const handleApply = useCallback(() => {
    const payload = buildPayload();
    const searchParams = payloadToSearchFilters(payload, route.params?.keyword);
    navigation.navigate('SearchFilter', searchParams);
  }, [buildPayload, navigation, route.params?.keyword]);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <CategoryFilterSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.card }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} accessibilityRole="header">
          Filter Your Search
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.subText + '22' }]}>
          <Icon name="magnify" size={22} color={theme.subText} />
          <TextInput
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            placeholder="Search"
            placeholderTextColor={theme.subText}
            style={[styles.searchInput, { color: theme.text }]}
            accessibilityLabel="Filter search input"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>City</Text>
        <EmirateFilterChips
          emirates={emirates}
          selectedIds={selectedEmirates}
          onChange={setSelectedEmirates}
          isLoading={emiratesQuery.isLoading && emirates.length === 0}
          isError={emiratesQuery.isError}
          onRetry={() => emiratesQuery.refetch()}
        />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
        <CategoryGrid
          selectedCategoryId={categoryId}
          onPressCategory={handleCategorySelect}
        />

        {categoryId ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sub Category</Text>
            {isProperty ? (
              propertyCategoriesQuery.isLoading ? (
                <View style={styles.accordionWrap}>
                  <SubcategoryListSkeleton count={4} />
                </View>
              ) : propertyCategoriesQuery.isError ? (
                <Pressable
                  onPress={() => propertyCategoriesQuery.refetch()}
                  style={styles.retryWrap}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading property categories"
                >
                  <Text style={{ color: theme.primary }}>Retry property categories</Text>
                </Pressable>
              ) : (propertyCategoriesQuery.data ?? []).length === 0 ? (
                <View style={styles.retryWrap}>
                  <Text style={{ color: theme.subText }}>No property categories available.</Text>
                </View>
              ) : (
                <View style={styles.accordionWrap}>
                  <PropertySubcategoryAccordion
                    categories={propertyCategoriesQuery.data ?? []}
                    expandedCategoryId={expandedPropertyCategoryId}
                    selectedSubcategoryId={subCategoryId || undefined}
                    onToggleExpand={onTogglePropertyExpand}
                    onSelectSubcategory={onSelectPropertySubcategory}
                  />
                </View>
              )
            ) : subcategoriesQuery.isLoading ? (
              <ActivityIndicator color={theme.primary} style={styles.inlineLoader} />
            ) : subcategoriesQuery.isError ? (
              <Pressable onPress={() => subcategoriesQuery.refetch()} style={styles.retryWrap}>
                <Text style={{ color: theme.primary }}>Retry subcategories</Text>
              </Pressable>
            ) : (
              <View style={subCategoryStyles.wrap}>
                {(subcategoriesQuery.data ?? []).map((item: Category) => (
                  <SubCategoryChip
                    key={item._id}
                    label={item.name}
                    selected={subCategoryId === item._id}
                    onPress={() => handleSubcategorySelect(item._id, item.name)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}

        {isMotorsCategory(categoryName) && subCategoryId ? (
          <FilterDropdown
            label="Make & Model"
            placeholder="Search eg: Toyota Land Cruiser 70"
            value={makeModelId}
            options={mapCategoriesToDropdownOptions(makeModelsQuery.data ?? [])}
            disabled={!subCategoryId || makeModelsQuery.isLoading}
            onSelect={option => {
              setMakeModelId(option.id);
              setMakeModelName(option.label);
              setTrimId('');
              setTrimName('');
            }}
          />
        ) : null}

        {isMotorsCategory(categoryName) && makeModelId ? (
          <FilterDropdown
            label="Trim"
            placeholder="Select Trim"
            value={trimId}
            options={mapCategoriesToDropdownOptions(trimsQuery.data ?? [])}
            disabled={!makeModelId || trimsQuery.isLoading}
            onSelect={option => {
              setTrimId(option.id);
              setTrimName(option.label);
            }}
          />
        ) : null}

        <PriceRangeSlider
          minValue={minPrice}
          maxValue={maxPrice}
          onChangeMin={setMinPrice}
          onChangeMax={setMaxPrice}
        />

        {subCategoryId ? (
          <>
            {dynamicFiltersQuery.isLoading ? (
              <ActivityIndicator color={theme.primary} style={styles.inlineLoader} />
            ) : dynamicFiltersQuery.isError ? (
              <Pressable onPress={() => dynamicFiltersQuery.refetch()} style={styles.retryWrap}>
                <Text style={{ color: theme.primary }}>Retry filters</Text>
              </Pressable>
            ) : (
              <DynamicFilterRenderer
                fields={dynamicFiltersQuery.data ?? []}
                values={dynamicValues}
                onChange={handleDynamicChange}
              />
            )}

            <View style={styles.yearRow}>
              <View style={styles.yearField}>
                <Text style={[styles.yearLabel, { color: theme.text }]}>Year</Text>
                <View style={styles.yearInputs}>
                  <TextInput
                    value={yearFrom}
                    onChangeText={setYearFrom}
                    placeholder="From"
                    placeholderTextColor={theme.subText}
                    keyboardType="number-pad"
                    style={[styles.yearInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                  />
                  <TextInput
                    value={yearTo}
                    onChangeText={setYearTo}
                    placeholder="To"
                    placeholderTextColor={theme.subText}
                    keyboardType="number-pad"
                    style={[styles.yearInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.yearRow}>
              <View style={styles.yearField}>
                <Text style={[styles.yearLabel, { color: theme.text }]}>Kilometers</Text>
                <View style={styles.yearInputs}>
                  <TextInput
                    value={minKm}
                    onChangeText={setMinKm}
                    placeholder="Min"
                    placeholderTextColor={theme.subText}
                    keyboardType="number-pad"
                    style={[styles.yearInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                  />
                  <TextInput
                    value={maxKm}
                    onChangeText={setMaxKm}
                    placeholder="Max"
                    placeholderTextColor={theme.subText}
                    keyboardType="number-pad"
                    style={[styles.yearInput, { color: theme.text, borderColor: theme.subText + '33' }]}
                  />
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.subText + '22' }]}>
        <Pressable
          style={[styles.clearBtn, { backgroundColor: theme.card }]}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
        >
          <Text style={[styles.clearText, { color: theme.primary }]}>Clear</Text>
        </Pressable>
        <Pressable
          style={[styles.applyBtn, { backgroundColor: theme.primary }]}
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
        >
          <Text style={styles.applyText}>Apply Filter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 24 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  retryWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  accordionWrap: {
    paddingHorizontal: 16,
  },
  inlineLoader: {
    marginBottom: 16,
  },
  yearRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  yearField: { gap: 10 },
  yearLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  yearInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
