import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  badgeCount?: number;
  onPress: () => void;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SearchHeaderPill = memo<Props>(
  ({ label, icon, active = false, badgeCount, onPress, accessibilityHint }) => {
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
          scale.value = withSpring(0.96, { damping: 16, stiffness: 340 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 340 });
        }}
        android_ripple={{ color: theme.primary + '22', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel={showBadge ? `${label}, ${badgeCount} active` : label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ selected: active }}
        style={[
          styles.pill,
          {
            backgroundColor: active ? theme.primary : theme.primary + '14',
            borderColor: active ? theme.primary : theme.primary + '28',
            shadowColor: '#000',
          },
          animStyle,
        ]}
      >
        {icon ? (
          <Icon name={icon} size={16} color={active ? '#FFFFFF' : theme.primary} />
        ) : null}
        <Text
          style={[styles.label, { color: active ? '#FFFFFF' : theme.primary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {showBadge && !active ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        ) : null}
      </AnimatedPressable>
    );
  },
);

SearchHeaderPill.displayName = 'SearchHeaderPill';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
