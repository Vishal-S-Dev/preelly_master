import React, { memo, ReactNode } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CREATE_POST_PRIMARY } from '../../hooks/useCreatePostStyles';
import { cpStyles } from './createPostStyles';

interface Props {
  title: string;
  subtitle?: string;
  /** Legacy MaterialCommunityIcons name (used when iconElement is omitted). */
  icon?: string;
  iconElement?: ReactNode;
  onPress: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MediaPickerCard = memo<Props>(
  ({
    title,
    subtitle,
    icon,
    iconElement,
    onPress,
    children,
    style,
    onLayout,
  }) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        style={[cpStyles.mediaCard, style, animStyle]}
        onLayout={onLayout}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.985, { damping: 18, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 220 });
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={cpStyles.mediaCardIconWrap}>
          {iconElement ??
            (icon ? (
              <Icon name={icon} size={40} color={CREATE_POST_PRIMARY} />
            ) : null)}
        </View>
        <Text style={cpStyles.mediaCardTitle}>{title}</Text>
        {subtitle ? <Text style={cpStyles.mediaCardSub}>{subtitle}</Text> : null}
        {children}
      </AnimatedPressable>
    );
  },
);

MediaPickerCard.displayName = 'MediaPickerCard';
