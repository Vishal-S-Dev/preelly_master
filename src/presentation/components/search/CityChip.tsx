import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SearchCity } from '../../../types/search.types';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  label: SearchCity;
  selected: boolean;
  onPress: (city: SearchCity) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CHIP_BORDER = '#E5E7EB';

export const CityChip = memo<Props>(({ label, selected, onPress }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onPress(label)}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`City filter ${label}`}
      accessibilityState={{ selected }}
      accessibilityHint="Filters search results by city"
      style={[
        styles.chip,
        selected
          ? { backgroundColor: theme.primary, borderWidth: 0 }
          : {
              backgroundColor: theme.background,
              borderColor: CHIP_BORDER,
              borderWidth: 1,
            },
        animStyle,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? '#FFFFFF' : theme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});

CityChip.displayName = 'CityChip';

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
