import React, { memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { EmiratesItem } from '../../../types/categoryFilter.types';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  emirates: EmiratesItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CHIP_BORDER = '#E5E7EB';

const OptionChip = memo<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>(({ label, selected, onPress }) => {
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
      accessibilityLabel={`Emirate ${label}`}
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
      <Text style={[styles.chipLabel, { color: selected ? theme.primary : theme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
});

OptionChip.displayName = 'EmirateOptionChip';

export const EmirateFilterChips = memo<Props>(
  ({ emirates, selectedIds, onChange, isLoading, isError, onRetry }) => {
    const theme = useAppTheme();

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const toggleEmirate = useCallback(
      (id: string) => {
        const next = selectedSet.has(id)
          ? selectedIds.filter(item => item !== id)
          : [...selectedIds, id];
        onChange(next);
      },
      [onChange, selectedIds, selectedSet],
    );

    if (isLoading) {
      return <ActivityIndicator color={theme.primary} style={styles.loader} />;
    }

    if (isError) {
      return (
        <Pressable onPress={onRetry} style={styles.retryWrap} accessibilityRole="button">
          <Text style={{ color: theme.primary }}>Retry loading cities</Text>
        </Pressable>
      );
    }

    return (
      <View style={styles.chipWrap}>
        {emirates.map(item => (
          <OptionChip
            key={item._id}
            label={item.name}
            selected={selectedSet.has(item._id)}
            onPress={() => toggleEmirate(item._id)}
          />
        ))}
      </View>
    );
  },
);

EmirateFilterChips.displayName = 'EmirateFilterChips';

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  chip: {
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
  loader: {
    marginLeft: 16,
  },
  retryWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
