import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  PlaceSelection,
  PlaceSuggestion,
  resolvePlaceSelection,
  searchPlaces,
} from '../../../../../utils/placesSearch';
import { PE_COLORS } from '../profileEditStyles';

interface Props {
  onPlaceSelected: (place: PlaceSelection) => void;
  disabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 350;

export const AddressPlaceSearch = memo<Props>(({ onPlaceSelected, disabled = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setErrorMessage(null);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      searchAbortRef.current?.abort();
      resolveAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      searchAbortRef.current?.abort();
      setIsSearching(false);
      clearSuggestions();
      return;
    }

    debounceRef.current = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setIsSearching(true);
      setErrorMessage(null);

      try {
        const results = await searchPlaces(trimmed, controller.signal);
        if (requestId !== requestIdRef.current || controller.signal.aborted) {
          return;
        }
        setSuggestions(results);
        if (results.length === 0) {
          setErrorMessage('No places found. Try a different address.');
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setSuggestions([]);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to search addresses right now.',
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [clearSuggestions, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    clearSuggestions();
    setIsSearching(false);
  }, [clearSuggestions]);

  const handleSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      resolveAbortRef.current?.abort();
      const controller = new AbortController();
      resolveAbortRef.current = controller;

      setIsResolving(true);
      setErrorMessage(null);

      try {
        const place = await resolvePlaceSelection(suggestion, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        if (!place) {
          setErrorMessage('Unable to open that place. Try another result.');
          return;
        }

        onPlaceSelected(place);
        setQuery(place.formattedAddress || suggestion.primaryText);
        clearSuggestions();
        Keyboard.dismiss();
        setIsFocused(false);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to open that place right now.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsResolving(false);
        }
      }
    },
    [clearSuggestions, onPlaceSelected],
  );

  const showDropdown =
    isFocused && (suggestions.length > 0 || Boolean(errorMessage) || isSearching);

  return (
    <View style={styles.wrap} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={[styles.inputShell, isFocused && styles.inputShellFocused]}>
        <Icon name="magnify" size={wp('5.2%')} color={PE_COLORS.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search address or place"
          placeholderTextColor={PE_COLORS.muted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          editable={!disabled && !isResolving}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Keep dropdown briefly so taps register on Android.
            setTimeout(() => setIsFocused(false), Platform.OS === 'android' ? 180 : 0);
          }}
          accessibilityLabel="Search address or place"
        />
        {isSearching || isResolving ? (
          <ActivityIndicator size="small" color={PE_COLORS.primary} />
        ) : query.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear address search"
          >
            <Icon name="close-circle" size={wp('5%')} color={PE_COLORS.muted} />
          </Pressable>
        ) : null}
      </View>

      {showDropdown ? (
        <View style={styles.dropdown}>
          {isSearching && suggestions.length === 0 && !errorMessage ? (
            <View style={styles.dropdownEmpty}>
              <ActivityIndicator size="small" color={PE_COLORS.primary} />
              <Text style={styles.dropdownEmptyText}>Searching places…</Text>
            </View>
          ) : null}

          {errorMessage && suggestions.length === 0 ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => {
                    void handleSelect(item);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.primaryText}`}
                >
                  <Icon name="map-marker-outline" size={wp('5%')} color={PE_COLORS.primary} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowPrimary} numberOfLines={1}>
                      {item.primaryText}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={styles.rowSecondary} numberOfLines={2}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

AddressPlaceSearch.displayName = 'AddressPlaceSearch';

const styles = StyleSheet.create({
  wrap: {
    zIndex: 20,
    marginBottom: hp('1.4%'),
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: PE_COLORS.border,
    borderRadius: 14,
    backgroundColor: PE_COLORS.inputBg,
    paddingHorizontal: wp('3.5%'),
    minHeight: Platform.OS === 'ios' ? hp('5.8%') : hp('6.2%'),
  },
  inputShellFocused: {
    borderColor: PE_COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: PE_COLORS.text,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    maxHeight: hp('28%'),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PE_COLORS.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  list: {
    maxHeight: hp('28%'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PE_COLORS.border,
  },
  rowPressed: {
    backgroundColor: PE_COLORS.primaryLight,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowPrimary: {
    fontSize: wp('3.7%'),
    fontWeight: '700',
    color: PE_COLORS.text,
  },
  rowSecondary: {
    marginTop: 2,
    fontSize: wp('3.2%'),
    lineHeight: wp('4.4%'),
    color: PE_COLORS.muted,
  },
  dropdownEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.6%'),
  },
  dropdownEmptyText: {
    fontSize: wp('3.4%'),
    color: PE_COLORS.muted,
  },
  errorText: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.4%'),
    fontSize: wp('3.3%'),
    color: PE_COLORS.error,
    lineHeight: wp('4.6%'),
  },
});
