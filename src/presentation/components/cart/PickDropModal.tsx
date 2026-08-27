import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeliveryApi } from '../../../data/api/DeliveryApi';
import {
  DEFAULT_PICK_DROP_CENTER,
  PICK_DROP_DELIVERY_COST,
  PICK_DROP_FEE,
  PICK_DROP_TIME_SLOTS,
} from '../../../constants/cartCheckoutConstants';
import { PickDropInfo } from '../../../types/cartCheckout.types';
import { formatCartDate } from '../../../utils/cartCheckoutUtils';
import { resolveGoogleMapsProvider } from '../../../utils/mapProvider';
import { getMapsNativeModule, MapsNativeModule } from '../../../utils/mapsNativeModule';
import { PlaceSuggestion, resolvePlaceSelection, searchPlaces } from '../../../utils/placesSearch';
import { reverseGeocode } from '../../../utils/reverseGeocode';
import { CART_COLORS } from '../../screens/cart/cartCheckoutStyles';

interface Props {
  visible: boolean;
  fixCost?: number;
  deliveryCost?: number;
  productId?: string;
  initialValue?: PickDropInfo | null;
  onClose: () => void;
  onConfirm: (info: PickDropInfo) => void;
}

const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 350;
const RECALC_DEBOUNCE_MS = 450;

export const PickDropModal: React.FC<Props> = ({
  visible,
  fixCost = PICK_DROP_FEE,
  deliveryCost: deliveryCostProp = PICK_DROP_DELIVERY_COST,
  productId,
  initialValue,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const mapsModule = getMapsNativeModule();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string>(PICK_DROP_TIME_SLOTS[0]);
  // const [showTimePicker, setShowTimePicker] = useState(false); // Select Time UI hidden
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');
  const [marker, setMarker] = useState(DEFAULT_PICK_DROP_CENTER);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryCost, setDeliveryCost] = useState(deliveryCostProp);
  const [isPricing, setIsPricing] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recalcDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);
  const priceRequestIdRef = useRef(0);
  const mapRef = useRef<InstanceType<MapsNativeModule['default']> | null>(null);

  const calculatePrice = useCallback(
    async (params: { latitude: number; longitude: number; address: string; nextPlaceId?: string }) => {
      if (!productId) {
        return;
      }
      const requestId = ++priceRequestIdRef.current;
      setIsPricing(true);
      setPriceError(null);

      try {
        const result = await DeliveryApi.calculatePrice({
          productId,
          dropLatitude: params.latitude,
          dropLongitude: params.longitude,
          dropAddress: params.address,
          placeId: params.nextPlaceId,
        });
        if (requestId !== priceRequestIdRef.current) {
          return;
        }
        setZoneName(result.zone?.name ?? '');
        setZoneCode(result.zone?.code ?? '');
        setDistanceKm(
          typeof result.distance?.kilometers === 'number' ? result.distance.kilometers : null,
        );
        setDeliveryCost(Number(result.pricing?.totalPrice ?? deliveryCostProp));
      } catch (error) {
        if (requestId !== priceRequestIdRef.current) {
          return;
        }
        setPriceError(
          error instanceof Error ? error.message : 'Unable to calculate delivery price.',
        );
      } finally {
        if (requestId === priceRequestIdRef.current) {
          setIsPricing(false);
        }
      }
    },
    [deliveryCostProp, productId],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    let nextMarker = DEFAULT_PICK_DROP_CENTER;
    let nextAddr1 = '';

    if (initialValue) {
      setDate(new Date(initialValue.date));
      setTimeSlot(initialValue.timeSlot);
      nextAddr1 = initialValue.addr1;
      setAddr1(nextAddr1);
      setAddr2(initialValue.addr2);
      nextMarker = { latitude: initialValue.lat, longitude: initialValue.lng };
      setMarker(nextMarker);
      setZoneName(initialValue.zoneName ?? '');
      setZoneCode(initialValue.zoneCode ?? '');
      setDistanceKm(initialValue.distanceKm ?? null);
      setDeliveryCost(initialValue.deliveryCost ?? deliveryCostProp);
    } else {
      setDate(new Date());
      setTimeSlot(PICK_DROP_TIME_SLOTS[0]);
      setAddr1('');
      setAddr2('');
      setMarker(DEFAULT_PICK_DROP_CENTER);
      setZoneName('');
      setZoneCode('');
      setDistanceKm(null);
      setDeliveryCost(deliveryCostProp);
    }
    setSearchQuery('');
    setSuggestions([]);
    setPriceError(null);

    mapRef.current?.animateToRegion(
      { ...nextMarker, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      0,
    );

    const runInitialCalculation = async () => {
      let address = nextAddr1;
      if (!address) {
        const result = await reverseGeocode(nextMarker.latitude, nextMarker.longitude);
        address = result?.formattedAddress ?? '';
        if (address) {
          setAddr1(address);
        }
      }
      if (address) {
        void calculatePrice({
          latitude: nextMarker.latitude,
          longitude: nextMarker.longitude,
          address,
          nextPlaceId: undefined,
        });
      }
    };
    void runInitialCalculation();
    // Runs once per modal open (and when the pre-filled edit value changes) — not on every
    // calculatePrice identity change, since that would refire on unrelated productId churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryCostProp, initialValue, visible]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (recalcDebounceRef.current) {
        clearTimeout(recalcDebounceRef.current);
      }
      searchAbortRef.current?.abort();
      resolveAbortRef.current?.abort();
    },
    [],
  );

  const total = useMemo(
    () => Number((fixCost + deliveryCost).toFixed(2)),
    [deliveryCost, fixCost],
  );

  const onDateChange = useCallback((event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    setDate(selected);
  }, []);

  const scheduleRecalculate = useCallback(
    (latitude: number, longitude: number) => {
      if (recalcDebounceRef.current) {
        clearTimeout(recalcDebounceRef.current);
      }
      recalcDebounceRef.current = setTimeout(async () => {
        const result = await reverseGeocode(latitude, longitude);
        const address = result?.formattedAddress ?? '';
        if (address) {
          setAddr1(address);
        }
        void calculatePrice({ latitude, longitude, address, nextPlaceId: undefined });
      }, RECALC_DEBOUNCE_MS);
    },
    [calculatePrice],
  );

  const handleMarkerMove = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      setMarker(coordinate);
      scheduleRecalculate(coordinate.latitude, coordinate.longitude);
    },
    [scheduleRecalculate],
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSearchError(null);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < SEARCH_MIN_LENGTH) {
      searchAbortRef.current?.abort();
      setIsSearching(false);
      clearSuggestions();
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const requestId = ++searchRequestIdRef.current;

      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchPlaces(trimmed, controller.signal);
        if (requestId !== searchRequestIdRef.current || controller.signal.aborted) {
          return;
        }
        setSuggestions(results);
        if (results.length === 0) {
          setSearchError('No places found. Try a different address.');
        }
      } catch (error) {
        if (controller.signal.aborted || requestId !== searchRequestIdRef.current) {
          return;
        }
        setSuggestions([]);
        setSearchError(
          error instanceof Error ? error.message : 'Unable to search addresses right now.',
        );
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [clearSuggestions, searchQuery]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestion) => {
      resolveAbortRef.current?.abort();
      const controller = new AbortController();
      resolveAbortRef.current = controller;

      setIsResolvingPlace(true);
      setSearchError(null);

      try {
        const place = await resolvePlaceSelection(suggestion, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        if (!place) {
          setSearchError('Unable to open that place. Try another result.');
          return;
        }

        if (recalcDebounceRef.current) {
          clearTimeout(recalcDebounceRef.current);
        }

        setMarker({ latitude: place.latitude, longitude: place.longitude });
        mapRef.current?.animateToRegion(
          {
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          350,
        );
        setAddr1(place.formattedAddress);
        setSearchQuery('');
        clearSuggestions();
        Keyboard.dismiss();
        setIsSearchFocused(false);

        void calculatePrice({
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.formattedAddress,
          nextPlaceId: suggestion.placeId,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setSearchError(
          error instanceof Error ? error.message : 'Unable to open that place right now.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsResolvingPlace(false);
        }
      }
    },
    [calculatePrice, clearSuggestions],
  );

  const confirm = useCallback(() => {
    if (!addr1.trim()) {
      Alert.alert('Address required', 'Enter building or street name.');
      return;
    }
    const address = [addr1.trim(), addr2.trim()].filter(Boolean).join(', ');
    onConfirm({
      date: date.toISOString().slice(0, 10),
      timeSlot,
      address,
      addr1: addr1.trim(),
      addr2: addr2.trim(),
      lat: marker.latitude,
      lng: marker.longitude,
      fixCost,
      deliveryCost,
      total,
      zoneName: zoneName || undefined,
      zoneCode: zoneCode || undefined,
      distanceKm: distanceKm ?? undefined,
    });
  }, [
    addr1,
    addr2,
    date,
    deliveryCost,
    distanceKm,
    fixCost,
    marker.latitude,
    marker.longitude,
    onConfirm,
    timeSlot,
    total,
    zoneCode,
    zoneName,
  ]);

  const MapViewComponent = mapsModule?.default;
  const MarkerComponent = mapsModule?.Marker;
  const mapProvider = resolveGoogleMapsProvider();

  const showSearchDropdown =
    isSearchFocused && (suggestions.length > 0 || Boolean(searchError) || isSearching);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="chevron-left" size={28} color={CART_COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Opt for Preelly Pay</Text>
          <Pressable hitSlop={12}>
            <Icon name="help-circle-outline" size={22} color={CART_COLORS.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Pick & Drop Service</Text>
            <Text style={styles.chargeText}>
              Starts with{' '}
              <Text style={styles.chargeAmount}>AED {fixCost.toFixed(2)}</Text>
            </Text>
          </View>

          <Text style={styles.subTitle}>Confirm Time</Text>
          <Text style={styles.fieldLabel}>Select Date*</Text>
          <Pressable style={styles.fieldBox} onPress={() => setShowDatePicker(true)}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldText}>{formatCartDate(date.toISOString())}</Text>
              <Icon name="calendar" size={20} color={CART_COLORS.text} />
            </View>
          </Pressable>

          {/* Select Time field hidden — not a required field. timeSlot still defaults to
              PICK_DROP_TIME_SLOTS[0] and is included in the confirmed PickDropInfo payload,
              so CartCheckoutScreen's summary and the API contract are unaffected. */}
          {/* <Text style={styles.fieldLabel}>Select Time*</Text>
          <Pressable style={styles.fieldBox} onPress={() => setShowTimePicker(prev => !prev)}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldText}>{timeSlot}</Text>
              <Icon name="clock-outline" size={20} color={CART_COLORS.text} />
            </View>
          </Pressable>
          {showTimePicker ? (
            <View style={styles.timeSlots}>
              {PICK_DROP_TIME_SLOTS.map(slot => (
                <Pressable
                  key={slot}
                  style={[styles.timeSlot, slot === timeSlot ? styles.timeSlotActive : null]}
                  onPress={() => {
                    setTimeSlot(slot);
                    setShowTimePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      slot === timeSlot ? styles.timeSlotTextActive : null,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null} */}

          <Text style={styles.subTitle}>Confirm Drop Location</Text>
          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>Is the pin in the right location?</Text>
            <Text style={styles.mapHint}>
              Click and drag the pin to the exact spot of your product location
            </Text>

            <View style={styles.searchWrap}>
              <View style={[styles.searchShell, isSearchFocused && styles.searchShellFocused]}>
                <Icon name="magnify" size={20} color={CART_COLORS.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for your drop address"
                  placeholderTextColor={CART_COLORS.muted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  editable={!isResolvingPlace}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), Platform.OS === 'android' ? 180 : 0);
                  }}
                  accessibilityLabel="Search for your drop address"
                />
                {isSearching || isResolvingPlace ? (
                  <ActivityIndicator size="small" color={CART_COLORS.primary} />
                ) : searchQuery.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      setSearchQuery('');
                      clearSuggestions();
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear address search"
                  >
                    <Icon name="close-circle" size={18} color={CART_COLORS.muted} />
                  </Pressable>
                ) : null}
              </View>

              {showSearchDropdown ? (
                <View style={styles.searchDropdown}>
                  {isSearching && suggestions.length === 0 && !searchError ? (
                    <View style={styles.searchDropdownEmpty}>
                      <ActivityIndicator size="small" color={CART_COLORS.primary} />
                      <Text style={styles.searchDropdownEmptyText}>Searching places…</Text>
                    </View>
                  ) : null}

                  {searchError && suggestions.length === 0 ? (
                    <Text style={styles.searchErrorText}>{searchError}</Text>
                  ) : null}

                  {suggestions.length > 0 ? (
                    <FlatList
                      data={suggestions}
                      keyExtractor={item => item.id}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      style={styles.searchList}
                      renderItem={({ item }) => (
                        <Pressable
                          style={({ pressed }) => [
                            styles.searchRow,
                            pressed && styles.searchRowPressed,
                          ]}
                          onPress={() => {
                            void handleSelectSuggestion(item);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${item.primaryText}`}
                        >
                          <Icon
                            name="map-marker-outline"
                            size={18}
                            color={CART_COLORS.primary}
                          />
                          <View style={styles.searchRowTextWrap}>
                            <Text style={styles.searchRowPrimary} numberOfLines={1}>
                              {item.primaryText}
                            </Text>
                            {item.secondaryText ? (
                              <Text style={styles.searchRowSecondary} numberOfLines={2}>
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

            <View style={styles.mapWrap}>
              {MapViewComponent && MarkerComponent ? (
                <MapViewComponent
                  ref={mapRef}
                  style={styles.map}
                  provider={mapProvider}
                  initialRegion={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  onPress={event => handleMarkerMove(event.nativeEvent.coordinate)}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  showsCompass={false}
                  toolbarEnabled={false}
                  loadingEnabled
                  moveOnMarkerPress={false}
                >
                  <MarkerComponent
                    coordinate={marker}
                    draggable
                    onDragEnd={event => handleMarkerMove(event.nativeEvent.coordinate)}
                  />
                </MapViewComponent>
              ) : (
                <View style={styles.mapFallback}>
                  <Text style={styles.mapHint}>Map preview unavailable</Text>
                </View>
              )}
            </View>

            {addr1 ? <Text style={styles.resolvedAddress}>{addr1}</Text> : null}

            {zoneName || isPricing || priceError ? (
              <View style={styles.metaRow}>
                {isPricing ? (
                  <View style={styles.metaLoadingRow}>
                    <ActivityIndicator size="small" color={CART_COLORS.primary} />
                    <Text style={styles.metaLoadingText}>Calculating delivery price…</Text>
                  </View>
                ) : priceError ? (
                  <Text style={styles.searchErrorText}>{priceError}</Text>
                ) : (
                  <>
                    <Icon name="map-marker-radius-outline" size={16} color={CART_COLORS.primary} />
                    <Text style={styles.metaText}>
                      Zone: <Text style={styles.metaValue}>{zoneName}</Text>
                    </Text>
                    {typeof distanceKm === 'number' ? (
                      <Text style={styles.metaText}>
                        Distance: <Text style={styles.metaValue}>{distanceKm.toFixed(2)} km</Text>
                      </Text>
                    ) : null}
                    <Text style={styles.metaText}>
                      Delivery:{' '}
                      <Text style={styles.metaValue}>AED {deliveryCost.toFixed(2)}</Text>
                    </Text>
                  </>
                )}
              </View>
            ) : null}
          </View>

          <Text style={styles.fieldLabel}>Address Line 1</Text>
          <TextInput
            value={addr1}
            onChangeText={setAddr1}
            placeholder="Building or Street name"
            placeholderTextColor={CART_COLORS.muted}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Address Line 2</Text>
          <TextInput
            value={addr2}
            onChangeText={setAddr2}
            placeholder="Building or Street name"
            placeholderTextColor={CART_COLORS.muted}
            style={styles.input}
          />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Fix Cost</Text>
            <Text style={styles.priceValue}>AED {fixCost.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Pick & Drop cost
              {typeof distanceKm === 'number' ? (
                <Text style={styles.priceLabelMeta}>
                  {' '}
                  ({distanceKm.toFixed(2)} km{zoneCode ? ` · ${zoneCode}` : ''})
                </Text>
              ) : null}
            </Text>
            <Text style={styles.priceValue}>AED {deliveryCost.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, styles.totalLabel]}>Total</Text>
            <Text style={[styles.priceValue, styles.totalLabel]}>AED {total.toFixed(2)}</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={[styles.confirmBtn, isPricing && styles.confirmBtnDisabled]}
            onPress={confirm}
            disabled={isPricing}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>

      {showDatePicker && Platform.OS === 'ios' ? (
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.pickerSheetHeader}>
              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={12}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          </View>
        </View>
      ) : null}
      {showDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CART_COLORS.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CART_COLORS.text,
    flex: 1,
  },
  chargeText: {
    fontSize: 13,
    color: CART_COLORS.secureTitle,
    fontWeight: '600',
  },
  chargeAmount: {
    color: CART_COLORS.primary,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CART_COLORS.text,
    marginTop: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: CART_COLORS.secureTitle,
    marginBottom: 6,
  },
  fieldBox: {
    backgroundColor: CART_COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: {
    fontSize: 14,
    color: CART_COLORS.text,
  },
  timeSlots: {
    marginBottom: 12,
    gap: 8,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeSlotActive: {
    borderColor: CART_COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  timeSlotText: {
    fontSize: 13,
    color: CART_COLORS.text,
  },
  timeSlotTextActive: {
    color: CART_COLORS.primary,
    fontWeight: '700',
  },
  mapCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    zIndex: 10,
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CART_COLORS.text,
  },
  mapHint: {
    marginTop: 6,
    fontSize: 13,
    color: CART_COLORS.muted,
  },
  searchWrap: {
    marginTop: 12,
    zIndex: 20,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchShellFocused: {
    borderColor: CART_COLORS.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: CART_COLORS.text,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  searchList: {
    maxHeight: 220,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  searchRowPressed: {
    backgroundColor: '#EEF2FF',
  },
  searchRowTextWrap: {
    flex: 1,
  },
  searchRowPrimary: {
    fontSize: 13.5,
    fontWeight: '700',
    color: CART_COLORS.text,
  },
  searchRowSecondary: {
    marginTop: 2,
    fontSize: 12,
    color: CART_COLORS.muted,
  },
  searchDropdownEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchDropdownEmptyText: {
    fontSize: 13,
    color: CART_COLORS.muted,
  },
  searchErrorText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: '#DC2626',
  },
  mapWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedAddress: {
    marginTop: 12,
    fontSize: 13,
    color: CART_COLORS.text,
    backgroundColor: CART_COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLoadingText: {
    fontSize: 12.5,
    color: CART_COLORS.muted,
  },
  metaText: {
    fontSize: 12.5,
    color: CART_COLORS.secureTitle,
  },
  metaValue: {
    fontWeight: '800',
    color: CART_COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: CART_COLORS.text,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: CART_COLORS.secureTitle,
  },
  priceLabelMeta: {
    fontSize: 12,
    color: CART_COLORS.muted,
    fontWeight: '400',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: CART_COLORS.secureTitle,
  },
  totalLabel: {
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  confirmBtn: {
    backgroundColor: CART_COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 20,
    elevation: 20,
  },
  pickerSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pickerDoneText: {
    color: CART_COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
