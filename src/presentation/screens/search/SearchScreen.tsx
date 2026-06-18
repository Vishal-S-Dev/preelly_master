import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  DEFAULT_SEARCH_CITY,
  POPULAR_LISTING_SECTIONS,
  SEARCH_CITIES,
  SEARCH_SUGGESTIONS_MIN_LENGTH,
} from '../../../constants/searchConstants';
import { SearchCity, SearchListingItem } from '../../../types/search.types';
import { Category } from '../../../types/category.types';
import {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
} from '../../../types/categoryFilter.types';
import { SearchFilterParams } from '../../../types/searchFilter.types';
import { isPropertyCategory } from '../../../utils/isPropertyCategory';
import {
  PropertySubcategoryAccordion,
  PropertySubcategorySelection,
} from '../../components/createPost/PropertySubcategoryAccordion';
import { SubcategoryListSkeleton } from '../../components/createPost/SubcategoryListSkeleton';
import { DynamicFilterRenderer } from '../../components/filter/DynamicFilterRenderer';
import {
  FilterDropdown,
  mapCategoriesToDropdownOptions,
} from '../../components/filter/FilterDropdown';
import { PriceRangeSlider } from '../../components/filter/PriceRangeSlider';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useDynamicFilters } from '../../hooks/useDynamicFilters';
import { usePopularListings } from '../../hooks/usePopularListings';
import { usePopularSearches } from '../../hooks/usePopularSearches';
import { usePropertyCategories } from '../../hooks/usePropertyCategories';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useSubcategories } from '../../hooks/useSubcategories';
import { RootStackParamList } from '../../navigation/types';
import { CREATE_POST_CATEGORIES } from '../../../constants/createPostConstants';
import { isMotorsCategory, payloadToSearchFilters } from './categoryFilterUtils';
import { AccordionCategory } from '../../components/search/AccordionCategory';
import { CategoryGrid } from '../../components/search/CategoryGrid';
import { CityChip } from '../../components/search/CityChip';
import { SubCategoryChip, subCategoryStyles } from '../../components/filter/SubCategoryChip';
import { HorizontalVideoListing } from '../../components/search/HorizontalVideoListing';
import { RecentSearches } from '../../components/search/RecentSearches';
import { TrendingTag } from '../../components/search/TrendingTag';
import { createSearchStyles } from '../../components/search/searchStyles';
import { SearchSkeleton } from '../../components/skeletons/SearchSkeleton';
import { HorizontalVideoListingSkeleton } from '../../components/skeletons/HorizontalVideoListingSkeleton';
import { TrendingSkeleton } from '../../components/skeletons/TrendingSkeleton';

const HighlightedSuggestion = memo<{ text: string; query: string }>(
  ({ text, query }) => {
    const theme = useAppTheme();
    const lowerText = text.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (!lowerQuery || index < 0) {
      return <Text style={{ color: theme.text, fontSize: 15 }}>{text}</Text>;
    }

    const before = text.slice(0, index);
    const match = text.slice(index, index + lowerQuery.length);
    const after = text.slice(index + lowerQuery.length);

    return (
      <Text style={{ fontSize: 15, color: theme.text }}>
        {before}
        <Text style={{ fontWeight: '700', color: theme.primary }}>{match}</Text>
        {after}
      </Text>
    );
  },
);

HighlightedSuggestion.displayName = 'HighlightedSuggestion';

export const SearchScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createSearchStyles(theme), [theme]);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [selectedCity, setSelectedCity] =
    useState<SearchCity>(DEFAULT_SEARCH_CITY);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>();
  const [expandedPropertyCategoryId, setExpandedPropertyCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [makeModelId, setMakeModelId] = useState('');
  const [makeModelName, setMakeModelName] = useState('');
  const [trimId, setTrimId] = useState('');
  const [trimName, setTrimName] = useState('');
  const [minPrice, setMinPrice] = useState(DEFAULT_PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_PRICE_MAX);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minKm, setMinKm] = useState('');
  const [maxKm, setMaxKm] = useState('');
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | string[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isProperty = isPropertyCategory(selectedCategoryName);
  const showCategoryFilters = Boolean(selectedCategoryId);
  const activeSubCategoryId = subCategoryId || undefined;

  const {
    recentSearches,
    loaded: recentLoaded,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useRecentSearches();

  const popularQuery = usePopularSearches(10);
  const suggestionsQuery = useSearchSuggestions(query);
  const listingsQuery = usePopularListings(8);
  const subcategoriesQuery = useSubcategories(isProperty ? undefined : selectedCategoryId);
  const propertyCategoriesQuery = usePropertyCategories(isProperty && Boolean(selectedCategoryId));
  const makeModelsQuery = useSubcategories(
    isMotorsCategory(selectedCategoryName) && activeSubCategoryId ? activeSubCategoryId : undefined,
  );
  const trimsQuery = useSubcategories(
    isMotorsCategory(selectedCategoryName) && makeModelId ? makeModelId : undefined,
  );
  const dynamicFiltersQuery = useDynamicFilters(activeSubCategoryId);

  const trendingKeywords = popularQuery.data?.keywords ?? [];
  const suggestions = suggestionsQuery.data ?? [];
  const showAutocomplete =
    showSuggestions &&
    query.trim().length >= SEARCH_SUGGESTIONS_MIN_LENGTH &&
    (suggestionsQuery.isFetching ||
      suggestions.length > 0 ||
      suggestionsQuery.isError);

  const openSearchFilter = useCallback(
    (params: SearchFilterParams) => {
      navigation.navigate('SearchFilter', params);
    },
    [navigation],
  );

  const buildCityParam = useCallback(
    (city: SearchCity = selectedCity) =>
      city !== 'All Cities' ? city : undefined,
    [selectedCity],
  );

  const executeSearch = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        return;
      }
      setQuery(trimmed);
      setShowSuggestions(false);
      Keyboard.dismiss();
      await addRecentSearch(trimmed);
      openSearchFilter({
        keyword: trimmed,
        city: buildCityParam(),
      });
    },
    [addRecentSearch, buildCityParam, openSearchFilter],
  );

  const handleCityPress = useCallback(
    (city: SearchCity) => {
      setSelectedCity(city);
      openSearchFilter({
        keyword: query.trim() || undefined,
        city: city !== 'All Cities' ? city : undefined,
      });
    },
    [openSearchFilter, query],
  );

  const resetCategoryFilters = useCallback(() => {
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
  }, []);

  const handleCategoryPress = useCallback(
    (categoryId: string, categoryName: string) => {
      setSelectedCategoryId(categoryId);
      setSelectedCategoryName(categoryName);
      resetCategoryFilters();
    },
    [resetCategoryFilters],
  );

  const handleSubcategorySelect = useCallback((id: string, name: string) => {
    setSubCategoryId(id);
    setSubCategoryName(name);
    setMakeModelId('');
    setMakeModelName('');
    setTrimId('');
    setTrimName('');
    setDynamicValues({});
  }, []);

  const onTogglePropertyExpand = useCallback((parentId: string) => {
    setExpandedPropertyCategoryId(prev => (prev === parentId ? null : parentId));
  }, []);

  const onSelectPropertySubcategory = useCallback((selection: PropertySubcategorySelection) => {
    setSubCategoryId(selection.subcategoryId);
    setSubCategoryName(selection.name);
    setMakeModelId('');
    setMakeModelName('');
    setTrimId('');
    setTrimName('');
    setDynamicValues({});
  }, []);

  const handleDynamicChange = useCallback((fieldKey: string, value: string | string[]) => {
    setDynamicValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const buildFilterPayload = useCallback(() => {
    const cityName = selectedCity !== 'All Cities' ? selectedCity : undefined;
    return {
      emirates: [],
      emirateNames: cityName ? [cityName] : [],
      categoryId: selectedCategoryId ?? '',
      categoryName: selectedCategoryName ?? '',
      subCategoryId: subCategoryId,
      subCategoryName: subCategoryName,
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
      searchKeyword: query.trim() || subCategoryName || undefined,
      filters: dynamicValues,
    };
  }, [
    dynamicValues,
    makeModelId,
    makeModelName,
    maxKm,
    maxPrice,
    minKm,
    minPrice,
    query,
    selectedCategoryId,
    selectedCategoryName,
    selectedCity,
    subCategoryId,
    subCategoryName,
    trimId,
    trimName,
    yearFrom,
    yearTo,
  ]);

  const handleFilterClear = useCallback(() => {
    resetCategoryFilters();
  }, [resetCategoryFilters]);

  const handleFilterApply = useCallback(() => {
    if (!selectedCategoryId) {
      return;
    }
    const payload = buildFilterPayload();
    const searchParams = payloadToSearchFilters(payload, query.trim() || undefined);
    openSearchFilter({
      ...searchParams,
      city: buildCityParam(),
    });
  }, [buildFilterPayload, buildCityParam, openSearchFilter, query, selectedCategoryId]);

  const propertySubcategorySection = useMemo(() => {
    if (propertyCategoriesQuery.isLoading) {
      return (
        <View style={localStyles.accordionWrap}>
          <SubcategoryListSkeleton count={4} />
        </View>
      );
    }

    if (propertyCategoriesQuery.isError) {
      return (
        <View style={localStyles.stateWrap}>
          <Text style={[localStyles.stateText, { color: theme.subText }]}>
            Unable to load property categories.
          </Text>
          <Pressable
            style={[localStyles.retryBtn, { borderColor: theme.primary }]}
            onPress={() => propertyCategoriesQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading property categories"
          >
            <Text style={[localStyles.retryText, { color: theme.primary }]}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    const propertyCategories = propertyCategoriesQuery.data ?? [];
    if (!propertyCategories.length) {
      return (
        <View style={localStyles.stateWrap}>
          <Text style={[localStyles.stateText, { color: theme.subText }]}>
            No property categories available.
          </Text>
        </View>
      );
    }

    return (
      <View style={localStyles.accordionWrap}>
        <PropertySubcategoryAccordion
          categories={propertyCategories}
          expandedCategoryId={expandedPropertyCategoryId}
          selectedSubcategoryId={subCategoryId || undefined}
          onToggleExpand={onTogglePropertyExpand}
          onSelectSubcategory={onSelectPropertySubcategory}
        />
      </View>
    );
  }, [
    expandedPropertyCategoryId,
    onSelectPropertySubcategory,
    onTogglePropertyExpand,
    propertyCategoriesQuery.data,
    propertyCategoriesQuery.isError,
    propertyCategoriesQuery.isLoading,
    propertyCategoriesQuery.refetch,
    subCategoryId,
    theme.primary,
    theme.subText,
  ]);

  const dynamicFields = dynamicFiltersQuery.data ?? [];
  const showDynamicFilters =
    Boolean(activeSubCategoryId) &&
    !dynamicFiltersQuery.isLoading &&
    !dynamicFiltersQuery.isError &&
    dynamicFields.length > 0;

  const handleOpenListing = useCallback(
    (item: SearchListingItem) => {
      navigation.navigate('ProductDetail', { productId: item.id });
    },
    [navigation],
  );

  const initialLoading =
    !recentLoaded || (popularQuery.isLoading && !popularQuery.data);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <SearchSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={showCategoryFilters ? ['top', 'bottom'] : ['top']}
    >
      <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Search & Filter
        </Text>
      </Animated.View>

      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={22} color={theme.subText} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={text => {
              setQuery(text);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => executeSearch(query)}
            placeholder="Search for cars, property, electronics..."
            placeholderTextColor={theme.subText}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search input"
            accessibilityHint="Type at least two characters for suggestions"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Icon name="close-circle" size={20} color={theme.subText} />
            </Pressable>
          ) : null}
        </View>

        {showAutocomplete ? (
          <View style={styles.dropdown}>
            {suggestionsQuery.isFetching ? (
              <View style={styles.dropdownMeta}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : suggestionsQuery.isError ? (
              <View style={styles.dropdownMeta}>
                <Text style={styles.dropdownMetaText}>
                  Could not load suggestions.
                </Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={styles.dropdownMeta}>
                <Text style={styles.dropdownMetaText}>
                  No suggestions found.
                </Text>
              </View>
            ) : (
              suggestions.map(suggestion => (
                <Pressable
                  key={suggestion}
                  style={styles.dropdownItem}
                  onPress={() => executeSearch(suggestion)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${suggestion}`}
                >
                  <HighlightedSuggestion text={suggestion} query={query} />
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: showCategoryFilters ? 24 + insets.bottom : 32,
        }}
      >
        {!query.trim() ? (
          <RecentSearches
            items={recentSearches}
            onPress={executeSearch}
            onRemove={removeRecentSearch}
            onClearAll={clearRecentSearches}
          />
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>City</Text>
          <View style={styles.chipWrap}>
            {SEARCH_CITIES.map(city => (
              <CityChip
                key={city}
                label={city}
                selected={city === selectedCity}
                onPress={handleCityPress}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          {popularQuery.isLoading ? (
            <TrendingSkeleton />
          ) : (
            <View style={styles.chipWrap}>
              {trendingKeywords.length === 0 ? (
                <Text
                  style={[styles.dropdownMetaText, { paddingHorizontal: 0 }]}
                >
                  No trending searches yet.
                </Text>
              ) : (
                trendingKeywords.map(item => (
                  <TrendingTag
                    key={item}
                    label={item}
                    onPress={executeSearch}
                  />
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <CategoryGrid
            selectedCategoryId={selectedCategoryId}
            onPressCategory={handleCategoryPress}
          />
        </View>

        {selectedCategoryId ? (
          <Animated.View entering={FadeInDown.duration(240)} style={styles.section}>
            <Text style={styles.sectionTitle}>Sub Category</Text>
            {isProperty ? (
              propertySubcategorySection
            ) : subcategoriesQuery.isLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginLeft: 16 }} />
            ) : subcategoriesQuery.isError ? (
              <Pressable
                onPress={() => subcategoriesQuery.refetch()}
                style={localStyles.stateWrap}
                accessibilityRole="button"
                accessibilityLabel="Retry loading subcategories"
              >
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
          </Animated.View>
        ) : null}

        {showCategoryFilters ? (
          <Animated.View entering={FadeInDown.duration(240).delay(40)}>
            {isMotorsCategory(selectedCategoryName) && activeSubCategoryId ? (
              <FilterDropdown
                label="Make & Model"
                placeholder="Search eg: Toyota Land Cruiser 70"
                value={makeModelId}
                options={mapCategoriesToDropdownOptions(makeModelsQuery.data ?? [])}
                disabled={!activeSubCategoryId || makeModelsQuery.isLoading}
                onSelect={option => {
                  setMakeModelId(option.id);
                  setMakeModelName(option.label);
                  setTrimId('');
                  setTrimName('');
                }}
              />
            ) : null}

            {isMotorsCategory(selectedCategoryName) && makeModelId ? (
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

            {activeSubCategoryId ? (
              <>
                {dynamicFiltersQuery.isLoading ? (
                  <ActivityIndicator color={theme.primary} style={localStyles.inlineLoader} />
                ) : dynamicFiltersQuery.isError ? (
                  <Pressable
                    onPress={() => dynamicFiltersQuery.refetch()}
                    style={localStyles.retryWrap}
                  >
                    <Text style={{ color: theme.primary }}>Retry filters</Text>
                  </Pressable>
                ) : showDynamicFilters ? (
                  <DynamicFilterRenderer
                    fields={dynamicFields}
                    values={dynamicValues}
                    onChange={handleDynamicChange}
                  />
                ) : null}

                {isMotorsCategory(selectedCategoryName) ? (
                  <>
                    <View style={localStyles.yearRow}>
                      <View style={localStyles.yearField}>
                        <Text style={[localStyles.yearLabel, { color: theme.text }]}>Year</Text>
                        <View style={localStyles.yearInputs}>
                          <TextInput
                            value={yearFrom}
                            onChangeText={setYearFrom}
                            placeholder="From"
                            placeholderTextColor={theme.subText}
                            keyboardType="number-pad"
                            style={[
                              localStyles.yearInput,
                              { color: theme.text, borderColor: theme.subText + '33' },
                            ]}
                          />
                          <TextInput
                            value={yearTo}
                            onChangeText={setYearTo}
                            placeholder="To"
                            placeholderTextColor={theme.subText}
                            keyboardType="number-pad"
                            style={[
                              localStyles.yearInput,
                              { color: theme.text, borderColor: theme.subText + '33' },
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={localStyles.yearRow}>
                      <View style={localStyles.yearField}>
                        <Text style={[localStyles.yearLabel, { color: theme.text }]}>Kilometers</Text>
                        <View style={localStyles.yearInputs}>
                          <TextInput
                            value={minKm}
                            onChangeText={setMinKm}
                            placeholder="Min"
                            placeholderTextColor={theme.subText}
                            keyboardType="number-pad"
                            style={[
                              localStyles.yearInput,
                              { color: theme.text, borderColor: theme.subText + '33' },
                            ]}
                          />
                          <TextInput
                            value={maxKm}
                            onChangeText={setMaxKm}
                            placeholder="Max"
                            placeholderTextColor={theme.subText}
                            keyboardType="number-pad"
                            style={[
                              localStyles.yearInput,
                              { color: theme.text, borderColor: theme.subText + '33' },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </Animated.View>
        ) : null}

        {!showCategoryFilters &&
          (listingsQuery.isLoading
            ? POPULAR_LISTING_SECTIONS.map(section => (
                <HorizontalVideoListingSkeleton key={section.id} />
              ))
            : POPULAR_LISTING_SECTIONS.map(section => (
                <HorizontalVideoListing
                  key={section.id}
                  title={section.title}
                  data={listingsQuery.data ?? []}
                  type={section.id}
                  loading={listingsQuery.isFetching}
                  error={listingsQuery.isError}
                  onPress={handleOpenListing}
                />
              )))}

        {!showCategoryFilters ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by category</Text>
          <AccordionCategory onPressSubcategory={(categoryId, subId, label) => {
            const categoryName =
              CREATE_POST_CATEGORIES.find(item => item.id === categoryId)?.name ?? categoryId;
            handleCategoryPress(categoryId, categoryName);
            handleSubcategorySelect(subId, label);
          }} />
        </View>
        ) : null}
      </ScrollView>

      {showCategoryFilters ? (
        <View
          style={[
            localStyles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.subText + '22',
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <Pressable
            style={[localStyles.clearBtn, { backgroundColor: theme.card }]}
            onPress={handleFilterClear}
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
          >
            <Text style={[localStyles.clearText, { color: theme.primary }]}>Clear</Text>
          </Pressable>
          <Pressable
            style={[localStyles.applyBtn, { backgroundColor: theme.primary }]}
            onPress={handleFilterApply}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
          >
            <Text style={localStyles.applyText}>Apply Filter</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  accordionWrap: {
    paddingHorizontal: 16,
  },
  stateWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  retryWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
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
