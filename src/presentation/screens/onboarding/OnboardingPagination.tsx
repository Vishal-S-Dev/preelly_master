import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ONBOARDING_COLORS, onboardingScreenStyles } from './onboardingScreenStyles';

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 28;
const DOT_HEIGHT = 8;

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}

const PaginationDot = memo<DotProps>(({ index, scrollX, pageWidth }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [DOT_SIZE, ACTIVE_WIDTH, DOT_SIZE],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.45, 1, 0.45],
      Extrapolation.CLAMP,
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[styles.dot, animatedStyle]}
      accessibilityRole="none"
      accessibilityLabel={`Page ${index + 1} indicator`}
    />
  );
});

PaginationDot.displayName = 'PaginationDot';

interface Props {
  count: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}

export const OnboardingPagination = memo<Props>(({ count, scrollX, pageWidth }) => (
  <View
    style={onboardingScreenStyles.paginationRow}
    accessibilityRole="tablist"
    accessibilityLabel="Onboarding progress">
    {Array.from({ length: count }, (_, index) => (
      <PaginationDot key={`dot_${index}`} index={index} scrollX={scrollX} pageWidth={pageWidth} />
    ))}
  </View>
));

OnboardingPagination.displayName = 'OnboardingPagination';

const styles = StyleSheet.create({
  dot: {
    height: DOT_HEIGHT,
    borderRadius: DOT_HEIGHT / 2,
    backgroundColor: ONBOARDING_COLORS.dotActive,
  },
});
