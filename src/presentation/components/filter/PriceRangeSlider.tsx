import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { DEFAULT_PRICE_MAX, DEFAULT_PRICE_MIN } from '../../../types/categoryFilter.types';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  minValue: number;
  maxValue: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  absoluteMin?: number;
  absoluteMax?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

    const range = absoluteMax - absoluteMin;
    const leftPercent = useMemo(
      () => ((minValue - absoluteMin) / range) * 100,
      [absoluteMax, absoluteMin, minValue, range],
    );
    const widthPercent = useMemo(
      () => ((maxValue - minValue) / range) * 100,
      [maxValue, minValue, range],
    );

    const handleMinInput = useCallback(
      (text: string) => {
        const parsed = Number(text.replace(/[^\d]/g, ''));
        if (!Number.isFinite(parsed)) {
          return;
        }
        const next = clamp(parsed, absoluteMin, maxValue);
        onChangeMin(next);
      },
      [absoluteMin, maxValue, onChangeMin],
    );

    const handleMaxInput = useCallback(
      (text: string) => {
        const parsed = Number(text.replace(/[^\d]/g, ''));
        if (!Number.isFinite(parsed)) {
          return;
        }
        const next = clamp(parsed, minValue, absoluteMax);
        onChangeMax(next);
      },
      [absoluteMax, minValue, onChangeMax],
    );

    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: theme.text }]}>Price Range</Text>
        <View style={[styles.track, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.activeTrack,
              {
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputWrap, { borderColor: theme.subText + '33' }]}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Min</Text>
            <TextInput
              value={minValue.toLocaleString()}
              onChangeText={handleMinInput}
              keyboardType="number-pad"
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Minimum price"
            />
          </View>
          <View style={[styles.inputWrap, { borderColor: theme.subText + '33' }]}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Max</Text>
            <TextInput
              value={maxValue.toLocaleString()}
              onChangeText={handleMaxInput}
              keyboardType="number-pad"
              style={[styles.input, { color: theme.text }]}
              accessibilityLabel="Maximum price"
            />
          </View>
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
    marginBottom: 12,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  activeTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
  },
});
