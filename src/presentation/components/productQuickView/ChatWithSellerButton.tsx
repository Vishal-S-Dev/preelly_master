import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { QV_COLORS } from './productQuickViewStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ChatWithSellerButtonProps {
  onPress?: () => void;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Include safe-area padding under the CTA (default true). */
  includeSafeArea?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export const ChatWithSellerButton = memo<ChatWithSellerButtonProps>(
  ({
    onPress,
    label = 'Chat with seller',
    loading = false,
    disabled = false,
    includeSafeArea = true,
    style,
    containerStyle,
  }) => {
    const insets = useSafeAreaInsets();
    const scale = useSharedValue(1);
    const isDisabled = disabled || loading || !onPress;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <View
        style={[
          styles.container,
          includeSafeArea
            ? { paddingBottom: Math.max(insets.bottom, 12) }
            : null,
          containerStyle,
        ]}
      >
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled, busy: loading }}
          disabled={isDisabled}
          onPress={onPress}
          onPressIn={() => {
            if (!isDisabled) {
              scale.value = withSpring(0.97, { damping: 14 });
            }
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 14 });
          }}
          style={[
            styles.button,
            isDisabled ? styles.buttonDisabled : null,
            animatedStyle,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </AnimatedPressable>
      </View>
    );
  },
);

ChatWithSellerButton.displayName = 'ChatWithSellerButton';

const styles = StyleSheet.create({
  container: {
    backgroundColor: QV_COLORS.sheetBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.6%'),
  },
  button: {
    width: '100%',
    minHeight: hp('6.2%'),
    borderRadius: 999,
    backgroundColor: QV_COLORS.priceBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  label: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});
