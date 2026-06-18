import React, { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DEFAULT_PRICE_MAX, DEFAULT_PRICE_MIN } from '../../../types/categoryFilter.types';
import { formatIndianNumber, formatPriceDigits, parsePriceInput } from '../../../utils/priceFormat';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  minValue: number;
  maxValue: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  absoluteMin?: number;
  absoluteMax?: number;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const GripDots = memo(() => (
  <View style={styles.grip}>
    {Array.from({ length: 6 }).map((_, index) => (
      <View key={index} style={styles.gripDot} />
    ))}
  </View>
));

GripDots.displayName = 'GripDots';

const PriceInput = memo<{
  value: number;
  onChange: (value: number) => void;
  minBound: number;
  maxBound: number;
  accessibilityLabel: string;
}>(({ value, onChange, minBound, maxBound, accessibilityLabel }) => {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const displayValue = draft ?? formatIndianNumber(value);

  const commit = useCallback(
    (text: string) => {
      const parsed = parsePriceInput(text);
      if (!Number.isFinite(parsed)) {
        return;
      }
      const next = clamp(parsed, minBound, maxBound);
      onChange(next);
    },
    [maxBound, minBound, onChange],
  );

  return (
    <View style={[styles.inputWrap, { borderColor: theme.subText + '33', backgroundColor: theme.background }]}>
      <Text style={[styles.currency, { color: theme.subText }]}>AED</Text>
      <TextInput
        value={displayValue}
        onChangeText={text => {
          const digits = text.replace(/[^\d]/g, '');
          setDraft(formatPriceDigits(digits));
          const parsed = parsePriceInput(digits);
          if (Number.isFinite(parsed)) {
            onChange(clamp(parsed, minBound, maxBound));
          }
        }}
        onFocus={() => {
          setFocused(true);
          setDraft(formatIndianNumber(value));
        }}
        onBlur={() => {
          setFocused(false);
          if (draft != null) {
            commit(draft);
          }
          setDraft(null);
        }}
        keyboardType="number-pad"
        style={[styles.input, { color: theme.text }]}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Enter price in AED"
      />
      {focused ? (
        <View style={[styles.focusRing, { borderColor: theme.primary + '44' }]} pointerEvents="none" />
      ) : null}
    </View>
  );
});

PriceInput.displayName = 'PriceInput';

export const PriceRangeSlider = memo<Props>(
  ({
    minValue,
    maxValue,
    onChangeMin,
    onChangeMax,
    absoluteMin = DEFAULT_PRICE_MIN,
    absoluteMax = DEFAULT_PRICE_MAX,
  }) => {
    const theme = useAppTheme();
    const trackWidth = useSharedValue(0);
    const dragMinStart = useSharedValue(minValue);
    const dragMaxStart = useSharedValue(maxValue);
    const activeThumb = useSharedValue<'min' | 'max' | null>(null);

    const [draggingThumb, setDraggingThumb] = useState<'min' | 'max' | null>(null);

    const range = absoluteMax - absoluteMin;

    const minPercent = useMemo(
      () => (range > 0 ? ((minValue - absoluteMin) / range) * 100 : 0),
      [absoluteMin, minValue, range],
    );
    const maxPercent = useMemo(
      () => (range > 0 ? ((maxValue - absoluteMin) / range) * 100 : 100),
      [absoluteMin, maxValue, range],
    );
    const activeLeft = minPercent;
    const activeWidth = Math.max(maxPercent - minPercent, 0);

    const onTrackLayout = useCallback(
      (event: LayoutChangeEvent) => {
        trackWidth.value = event.nativeEvent.layout.width;
      },
      [trackWidth],
    );

    const setDragging = useCallback((thumb: 'min' | 'max' | null) => {
      setDraggingThumb(thumb);
    }, []);

    const updateMinFromDrag = useCallback(
      (next: number) => {
        const clamped = clamp(Math.round(next), absoluteMin, maxValue);
        onChangeMin(clamped);
      },
      [absoluteMin, maxValue, onChangeMin],
    );

    const updateMaxFromDrag = useCallback(
      (next: number) => {
        const clamped = clamp(Math.round(next), minValue, absoluteMax);
        onChangeMax(clamped);
      },
      [absoluteMax, minValue, onChangeMax],
    );

    const minPan = useMemo(
      () =>
        Gesture.Pan()
          .onBegin(() => {
            activeThumb.value = 'min';
            dragMinStart.value = minValue;
            runOnJS(setDragging)('min');
          })
          .onUpdate(event => {
            if (trackWidth.value <= 0 || range <= 0) {
              return;
            }
            const delta = (event.translationX / trackWidth.value) * range;
            runOnJS(updateMinFromDrag)(dragMinStart.value + delta);
          })
          .onFinalize(() => {
            activeThumb.value = null;
            runOnJS(setDragging)(null);
          }),
      [activeThumb, dragMinStart, minValue, range, setDragging, trackWidth, updateMinFromDrag],
    );

    const maxPan = useMemo(
      () =>
        Gesture.Pan()
          .onBegin(() => {
            activeThumb.value = 'max';
            dragMaxStart.value = maxValue;
            runOnJS(setDragging)('max');
          })
          .onUpdate(event => {
            if (trackWidth.value <= 0 || range <= 0) {
              return;
            }
            const delta = (event.translationX / trackWidth.value) * range;
            runOnJS(updateMaxFromDrag)(dragMaxStart.value + delta);
          })
          .onFinalize(() => {
            activeThumb.value = null;
            runOnJS(setDragging)(null);
          }),
      [activeThumb, dragMaxStart, maxValue, range, setDragging, trackWidth, updateMaxFromDrag],
    );

    const minThumbStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: activeThumb.value === 'min' ? withSpring(1.08, { damping: 14 }) : withSpring(1, { damping: 14 }),
        },
      ],
    }));

    const maxThumbStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: activeThumb.value === 'max' ? withSpring(1.08, { damping: 14 }) : withSpring(1, { damping: 14 }),
        },
      ],
    }));

    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: theme.text }]}>Price Range</Text>

        <View style={styles.sliderArea} onLayout={onTrackLayout}>
          <View style={[styles.track, { backgroundColor: theme.subText + '28' }]}>
            <View
              style={[
                styles.activeTrack,
                {
                  left: `${activeLeft}%`,
                  width: `${activeWidth}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <GestureDetector gesture={minPan}>
            <Animated.View
              style={[
                styles.thumb,
                {
                  left: `${minPercent}%`,
                  marginLeft: -THUMB_SIZE / 2,
                  borderColor: theme.subText + '44',
                  backgroundColor: theme.background,
                },
                minThumbStyle,
              ]}
              accessibilityRole="adjustable"
              accessibilityLabel={`Minimum price ${formatIndianNumber(minValue)} AED`}
            >
              <GripDots />
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={maxPan}>
            <Animated.View
              style={[
                styles.thumb,
                {
                  left: `${maxPercent}%`,
                  marginLeft: -THUMB_SIZE / 2,
                  borderColor: theme.subText + '44',
                  backgroundColor: theme.background,
                },
                maxThumbStyle,
              ]}
              accessibilityRole="adjustable"
              accessibilityLabel={`Maximum price ${formatIndianNumber(maxValue)} AED`}
            >
              <GripDots />
            </Animated.View>
          </GestureDetector>

          {draggingThumb === 'min' ? (
            <View style={[styles.tooltip, { left: `${minPercent}%`, marginLeft: -36, backgroundColor: theme.primary }]}>
              <Text style={styles.tooltipText}>AED {formatIndianNumber(minValue)}</Text>
            </View>
          ) : null}
          {draggingThumb === 'max' ? (
            <View style={[styles.tooltip, { left: `${maxPercent}%`, marginLeft: -36, backgroundColor: theme.primary }]}>
              <Text style={styles.tooltipText}>AED {formatIndianNumber(maxValue)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.inputRow}>
          <PriceInput
            value={minValue}
            onChange={onChangeMin}
            minBound={absoluteMin}
            maxBound={maxValue}
            accessibilityLabel="Minimum price in AED"
          />
          <PriceInput
            value={maxValue}
            onChange={onChangeMax}
            minBound={minValue}
            maxBound={absoluteMax}
            accessibilityLabel="Maximum price in AED"
          />
        </View>
      </View>
    );
  },
);

PriceRangeSlider.displayName = 'PriceRangeSlider';

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  sliderArea: {
    height: THUMB_SIZE + 28,
    justifyContent: 'center',
    marginBottom: 16,
    marginHorizontal: 16
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  activeTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: 14,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  grip: {
    width: 10,
    height: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  gripDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#374151',
  },
  tooltip: {
    position: 'absolute',
    top: -4,
    width: 72,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  currency: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
    textAlign: 'right',
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
  },
});
