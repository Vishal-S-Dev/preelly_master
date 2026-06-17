import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { SearchFilterParams } from '../../../types/searchFilter.types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { usePopularListings } from '../../hooks/usePopularListings';
import { usePopularSearches } from '../../hooks/usePopularSearches';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useSubcategories } from '../../hooks/useSubcategories';
import { RootStackParamList } from '../../navigation/types';
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
  const styles = useMemo(() => createSearchStyles(theme), [theme]);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [selectedCity, setSelectedCity] =
    useState<SearchCity>(DEFAULT_SEARCH_CITY);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>();
  const [showSuggestions, setShowSuggestions] = useState(false);

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
  const subcategoriesQuery = useSubcategories(selectedCategoryId);

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

  const handleCategoryPress = useCallback((categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
  }, []);

  const handleSubcategorySelect = useCallback(
    (subcategoryId: string, subcategoryName: string) => {
      if (!selectedCategoryId) {
        return;
      }
      openSearchFilter({
        categoryId: selectedCategoryId,
        subCategoryId: subcategoryId,
        categoryName: selectedCategoryName,
        subCategoryName: subcategoryName,
        keyword: subcategoryName,
        city: buildCityParam(),
      });
    },
    [buildCityParam, openSearchFilter, selectedCategoryId, selectedCategoryName],
  );

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
    <SafeAreaView style={styles.screen} edges={['top']}>
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
        contentContainerStyle={{ paddingBottom: 32 }}
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sub Category</Text>
            {subcategoriesQuery.isLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginLeft: 16 }} />
            ) : (
              <View style={subCategoryStyles.wrap}>
                {(subcategoriesQuery.data ?? []).map((item: Category) => (
                  <SubCategoryChip
                    key={item._id}
                    label={item.name}
                    selected={false}
                    onPress={() => handleSubcategorySelect(item._id, item.name)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {listingsQuery.isLoading
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
            ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by category</Text>
          <AccordionCategory onPressSubcategory={(categoryId, subId, label) => {
            setSelectedCategoryId(categoryId);
            handleSubcategorySelect(subId, label);
          }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
