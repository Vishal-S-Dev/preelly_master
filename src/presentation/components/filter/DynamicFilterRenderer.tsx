import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DynamicFilterField } from '../../../types/categoryFilter.types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FilterDropdown, mapCategoriesToDropdownOptions } from './FilterDropdown';

interface Props {
  fields: DynamicFilterField[];
  values: Record<string, string | string[]>;
  onChange: (fieldKey: string, value: string | string[]) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CHIP_BORDER = '#E5E7EB';
const VISIBLE_LIMIT = 8;

const COLOR_MAP: Record<string, string> = {
  blue: '#2563EB',
  black: '#111827',
  green: '#16A34A',
  grey: '#6B7280',
  gray: '#6B7280',
  maroon: '#7F1D1D',
  pink: '#DB2777',
  white: '#F3F4F6',
  red: '#DC2626',
  silver: '#9CA3AF',
};

const resolveColor = (value: string, explicit?: string): string =>
  explicit ?? COLOR_MAP[value.toLowerCase()] ?? COLOR_MAP[value.split(' ')[0]?.toLowerCase()] ?? '#9CA3AF';

const OptionChip = memo<{
  label: string;
  selected: boolean;
  onPress: () => void;
  colorDot?: string;
}>(({ label, selected, onPress, colorDot }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected
          ? {
              backgroundColor: theme.primary + '14',
              borderColor: theme.primary,
              borderWidth: 1.5,
            }
          : { backgroundColor: theme.background, borderColor: CHIP_BORDER, borderWidth: 1 },
        animStyle,
      ]}
    >
      {colorDot ? (
        <View style={[styles.colorDot, { backgroundColor: colorDot, borderColor: CHIP_BORDER }]} />
      ) : null}
      <Text style={[styles.chipLabel, { color: selected ? theme.primary : theme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
});

OptionChip.displayName = 'OptionChip';

const ChipGroup = memo<{
  field: DynamicFilterField;
  value: string | string[];
  onChange: (next: string | string[]) => void;
}>(({ field, value, onChange }) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const isMulti = field.fieldType === 'multi_select' || field.fieldType === 'color';
  const options = field.options ?? [];
  const visibleOptions = expanded ? options : options.slice(0, VISIBLE_LIMIT);

  const selectedSet = useMemo(() => {
    if (Array.isArray(value)) {
      return new Set(value);
    }
    return value ? new Set([value]) : new Set<string>();
  }, [value]);

  const toggleOption = useCallback(
    (optionValue: string) => {
      if (isMulti) {
        const current = Array.isArray(value) ? value : value ? [value] : [];
        const next = current.includes(optionValue)
          ? current.filter(item => item !== optionValue)
          : [...current, optionValue];
        onChange(next);
        return;
      }
      onChange(optionValue);
    },
    [isMulti, onChange, value],
  );

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{field.fieldTitle}</Text>
      <View style={styles.chipWrap}>
        {visibleOptions.map(option => (
          <OptionChip
            key={option.value}
            label={option.label}
            selected={selectedSet.has(option.value)}
            colorDot={field.fieldType === 'color' ? resolveColor(option.label, option.color) : undefined}
            onPress={() => toggleOption(option.value)}
          />
        ))}
      </View>
      {options.length > VISIBLE_LIMIT ? (
        <Pressable
          style={[styles.viewAllBtn, { borderColor: theme.primary }]}
          onPress={() => setExpanded(prev => !prev)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show fewer options' : 'View all options'}
        >
          <Text style={[styles.viewAllText, { color: theme.primary }]}>
            {expanded ? 'Show Less' : 'View All'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

ChipGroup.displayName = 'ChipGroup';

export const DynamicFilterRenderer = memo<Props>(({ fields, values, onChange }) => {
  if (!fields.length) {
    return null;
  }

  return (
    <View>
      {fields.map(field => {
        const currentValue = values[field.fieldKey] ?? (field.fieldType === 'multi_select' || field.fieldType === 'color' ? [] : '');

        if (field.fieldType === 'dropdown') {
          return (
            <FilterDropdown
              key={field.id}
              label={field.fieldTitle}
              placeholder={`Select ${field.fieldTitle}`}
              value={typeof currentValue === 'string' ? currentValue : undefined}
              options={mapCategoriesToDropdownOptions(
                (field.options ?? []).map(option => ({ _id: option.value, name: option.label })),
              )}
              onSelect={option => onChange(field.fieldKey, option.id)}
            />
          );
        }

        return (
          <ChipGroup
            key={field.id}
            field={field}
            value={currentValue}
            onChange={next => onChange(field.fieldKey, next)}
          />
        );
      })}
    </View>
  );
});

DynamicFilterRenderer.displayName = 'DynamicFilterRenderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  viewAllBtn: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
