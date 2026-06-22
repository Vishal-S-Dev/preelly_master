import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  label?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CaptureButton = memo<Props>(
  ({ disabled, loading, onPress, label = 'Capture this' }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        }}
        style={[styles.button, disabled && styles.buttonDisabled, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </AnimatedPressable>
    );
  },
);

CaptureButton.displayName = 'CaptureButton';

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0000FF',
    borderRadius: 999,

    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    shadowColor: '#0000FF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.42,
    shadowOpacity: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
