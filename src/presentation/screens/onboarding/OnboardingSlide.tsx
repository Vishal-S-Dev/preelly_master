import React, { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OnboardingSlideModel } from './onboarding.types';
import { onboardingScreenStyles } from './onboardingScreenStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  item: OnboardingSlideModel;
  index: number;
  scrollX: SharedValue<number>;
}

export const OnboardingSlide = memo<Props>(({ item, index, scrollX }) => {
  const contentStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [24, 0, 24], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.82, 1, 0.82], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View
      style={{ width: SCREEN_WIDTH, flex: 1 }}
      accessibilityRole="summary"
      accessibilityLabel={`${item.title.replace('\n', ' ')}. ${item.description}`}>
      <LinearGradient
        colors={[...item.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <Animated.View style={[styles.content, contentStyle]}>
          <Animated.View style={[onboardingScreenStyles.iconWrap, iconStyle]}>
            <Icon name={item.icon} size={SCREEN_WIDTH * 0.14} color="#FFFFFF" />
          </Animated.View>

          <Animated.Text style={onboardingScreenStyles.title}>{item.title}</Animated.Text>
          <Animated.Text style={onboardingScreenStyles.description}>{item.description}</Animated.Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
});

OnboardingSlide.displayName = 'OnboardingSlide';

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '0%',
    paddingBottom: 0,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
});
