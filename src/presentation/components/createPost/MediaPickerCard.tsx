import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { cpStyles } from './createPostStyles';

interface Props {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MediaPickerCard = memo<Props>(({ title, subtitle, icon, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[cpStyles.mediaCard, animStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}>
      <Icon name={icon} size={28} color="#0066CC" />
      <Text style={cpStyles.mediaCardTitle}>{title}</Text>
      {subtitle ? <Text style={cpStyles.mediaCardSub}>{subtitle}</Text> : null}
    </AnimatedPressable>
  );
});

MediaPickerCard.displayName = 'MediaPickerCard';
