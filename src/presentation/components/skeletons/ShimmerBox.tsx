import React, { memo, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  style?: ViewStyle;
  borderRadius?: number;
}

export const ShimmerBox = memo<Props>(({ style, borderRadius = 12 }) => {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: theme.card, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
});

ShimmerBox.displayName = 'ShimmerBox';

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
