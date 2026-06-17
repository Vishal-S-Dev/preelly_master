import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CHIP_BORDER = '#E5E7EB';

export const SubCategoryChip = memo<Props>(({ label, selected, onPress }) => {
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
      accessibilityLabel={`Subcategory ${label}`}
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
      <Text
        style={[styles.label, { color: selected ? theme.primary : theme.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});

SubCategoryChip.displayName = 'SubCategoryChip';

export const subCategoryStyles = StyleSheet.create({
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
});

const styles = subCategoryStyles;
