import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ProfileFollowState } from '../../../types/profile.types';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  followState: ProfileFollowState;
  followLoading?: boolean;
  followStatusLoading?: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onMore: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getFollowLabel = (followState: ProfileFollowState): string => {
  if (followState.pending) {
    return 'Requested';
  }
  if (followState.following) {
    return 'Following';
  }
  return 'Follow';
};

const PillButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  styles: ReturnType<typeof useProfileStyles>['styles'];
  colors: ReturnType<typeof useProfileStyles>['colors'];
}> = ({ label, onPress, disabled, loading, variant = 'primary', styles, colors }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      style={[
        styles.actionPill,
        variant === 'secondary' ? styles.pillSecondary : null,
        animStyle,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? colors.text : colors.actionText}
        />
      ) : (
        <Text
          style={[
            styles.actionPillText,
            variant === 'secondary' ? styles.pillSecondaryText : null,
          ]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
};

export const UserProfileActionButtons = memo<Props>(
  ({ followState, followLoading, followStatusLoading, onFollow, onMessage, onMore }) => {
    const { styles, colors } = useProfileStyles();
    const followLabel = getFollowLabel(followState);
    const isFollowing = followState.following || followState.pending;
    const isBlocked = followState.status === 'blocked';
    const followButtonLoading = Boolean(followLoading || followStatusLoading);

    return (
      <View style={styles.actionsRow}>
        <PillButton
          label={isBlocked ? 'Blocked' : followLabel}
          onPress={onFollow}
          loading={followButtonLoading}
          disabled={isBlocked}
          variant={isFollowing ? 'secondary' : 'primary'}
          styles={styles}
          colors={colors}
        />
        <PillButton label="Message" onPress={onMessage} styles={styles} colors={colors} />
        <Pressable onPress={onMore} style={styles.moreBtn} hitSlop={10}>
          <Icon name="dots-vertical" size={20} color={colors.actionText} />
        </Pressable>
      </View>
    );
  },
);

UserProfileActionButtons.displayName = 'UserProfileActionButtons';
