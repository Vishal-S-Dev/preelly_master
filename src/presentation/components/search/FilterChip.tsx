import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  label: string;
  selected?: boolean;
  badgeCount?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FilterChip = memo<Props>(({ label, selected = false, badgeCount, onPress }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      accessibilityRole="button"
      accessibilityLabel={showBadge ? `${label}, ${badgeCount} active filters` : label}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.background,
          borderColor: selected ? theme.primary : theme.subText + '33',
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
      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: selected ? '#FFFFFF' : theme.primary }]}>
          <Text style={[styles.badgeText, { color: selected ? theme.primary : '#FFFFFF' }]}>
            {badgeCount}
          </Text>
        </View>
      ) : null}
    </AnimatedPressable>
  );
});

FilterChip.displayName = 'FilterChip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
