import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';
import { CHIP_PRESS_SCALE, chipSpring } from '../../utils/searchMotion';

interface Props {
  label: string;
  selected?: boolean;
  badgeCount?: number;
  icon?: string;
  variant?: 'filled' | 'outline';
  onPress: () => void;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FilterChip = memo<Props>(
  ({
    label,
    selected = false,
    badgeCount,
    icon,
    variant = 'filled',
    onPress,
    accessibilityHint,
  }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;
  const isOutline = variant === 'outline';

  const chipColors = isOutline
    ? {
        backgroundColor: selected ? theme.primary + '10' : theme.background,
        borderColor: selected ? theme.primary : theme.subText + '33',
        textColor: selected ? theme.primary : theme.text,
        badgeBg: theme.primary,
        badgeText: '#FFFFFF',
      }
    : {
        backgroundColor: selected ? theme.primary : theme.background,
        borderColor: selected ? theme.primary : theme.subText + '33',
        textColor: selected ? '#FFFFFF' : theme.text,
        badgeBg: selected ? '#FFFFFF' : theme.primary,
        badgeText: selected ? theme.primary : '#FFFFFF',
      };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(CHIP_PRESS_SCALE, chipSpring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, chipSpring);
      }}
      android_ripple={{ color: theme.primary + '22', borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={showBadge ? `${label}, ${badgeCount} active filters` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: chipColors.backgroundColor,
          borderColor: chipColors.borderColor,
        },
        animStyle,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={14} color={chipColors.textColor} />
      ) : null}
      <Text
        style={[styles.label, { color: chipColors.textColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: chipColors.badgeBg }]}>
          <Text style={[styles.badgeText, { color: chipColors.badgeText }]}>
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
