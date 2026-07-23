import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  DEFAULT_PICK_DROP_CENTER,
  PICK_DROP_DELIVERY_COST,
  PICK_DROP_FEE,
  PICK_DROP_TIME_SLOTS,
} from '../../../constants/cartCheckoutConstants';
import { PickDropInfo } from '../../../types/cartCheckout.types';
import { formatCartDate } from '../../../utils/cartCheckoutUtils';
import { getMapsNativeModule } from '../../../utils/mapsNativeModule';
import { CART_COLORS } from '../../screens/cart/cartCheckoutStyles';

interface Props {
  visible: boolean;
  fixCost?: number;
  deliveryCost?: number;
  initialValue?: PickDropInfo | null;
  onClose: () => void;
  onConfirm: (info: PickDropInfo) => void;
}

export const PickDropModal: React.FC<Props> = ({
  visible,
  fixCost = PICK_DROP_FEE,
  deliveryCost = PICK_DROP_DELIVERY_COST,
  initialValue,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const mapsModule = getMapsNativeModule();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string>(PICK_DROP_TIME_SLOTS[0]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');
  const [marker, setMarker] = useState(DEFAULT_PICK_DROP_CENTER);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (initialValue) {
      setDate(new Date(initialValue.date));
      setTimeSlot(initialValue.timeSlot);
      setAddr1(initialValue.addr1);
      setAddr2(initialValue.addr2);
      setMarker({ latitude: initialValue.lat, longitude: initialValue.lng });
      return;
    }
    setDate(new Date());
    setTimeSlot(PICK_DROP_TIME_SLOTS[0]);
    setAddr1('');
    setAddr2('');
    setMarker(DEFAULT_PICK_DROP_CENTER);
  }, [initialValue, visible]);

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
    });
  }, [addr1, addr2, date, deliveryCost, fixCost, marker.latitude, marker.longitude, onConfirm, timeSlot, total]);

  const MapViewComponent = mapsModule?.default;
  const MarkerComponent = mapsModule?.Marker;

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

        <ScrollView contentContainerStyle={styles.content}>
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

          <Text style={styles.fieldLabel}>Select Time*</Text>
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
          ) : null}

          <Text style={styles.subTitle}>Confirm Drop Location</Text>
          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>Is the pin in the right location?</Text>
            <Text style={styles.mapHint}>
              Click and drag the pin to the exact spot of your product location
            </Text>
            <View style={styles.mapWrap}>
              {MapViewComponent && MarkerComponent ? (
                <MapViewComponent
                  style={styles.map}
                  initialRegion={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  onPress={event => setMarker(event.nativeEvent.coordinate)}
                >
                  <MarkerComponent
                    coordinate={marker}
                    draggable
                    onDragEnd={event => setMarker(event.nativeEvent.coordinate)}
                  />
                </MapViewComponent>
              ) : (
                <View style={styles.mapFallback}>
                  <Text style={styles.mapHint}>Map preview unavailable</Text>
                </View>
              )}
            </View>
          </View>

          <TextInput
            value={addr1}
            onChangeText={setAddr1}
            placeholder="Building or Street name"
            placeholderTextColor={CART_COLORS.muted}
            style={styles.input}
          />
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
            <Text style={styles.priceLabel}>Pick & Drop cost</Text>
            <Text style={styles.priceValue}>AED {deliveryCost.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, styles.totalLabel]}>Total</Text>
            <Text style={[styles.priceValue, styles.totalLabel]}>AED {total.toFixed(2)}</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
