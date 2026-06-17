import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  onEditProfile: () => void;
  onShareProfile: () => void;
  onMore: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PillButton: React.FC<{
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof useProfileStyles>['styles'];
}> = ({ label, onPress, styles }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      style={[styles.actionPill, animStyle]}>
      <Text style={styles.actionPillText}>{label}</Text>
    </AnimatedPressable>
  );
};

export const ProfileActionButtons = memo<Props>(
  ({ onEditProfile, onShareProfile, onMore }) => {
    const { styles, colors } = useProfileStyles();

    return (
      <View style={styles.actionsRow}>
        <PillButton label="Edit Profile" onPress={onEditProfile} styles={styles} />
        <PillButton label="Share Profile" onPress={onShareProfile} styles={styles} />
        <Pressable onPress={onMore} style={styles.moreBtn} hitSlop={10}>
          <Icon name="dots-vertical" size={20} color={colors.actionText} />
        </Pressable>
      </View>
    );
  },
);

ProfileActionButtons.displayName = 'ProfileActionButtons';
