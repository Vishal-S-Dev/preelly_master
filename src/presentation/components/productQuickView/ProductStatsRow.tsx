import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import HeartIcon from '../../../../assets/icons/heart_black.svg';
import HeartFillIcon from '../../../../assets/icons/heart_fill.svg';
import CommentIcon from '../../../../assets/icons/comment_black.svg';
import SendIcon from '../../../../assets/icons/send_black.svg';
import ViewIcon from '../../../../assets/icons/views_black.svg';
import BookmarkIcon from '../../../../assets/icons/bookmark_black.svg';
import BookmarkFillIcon from '../../../../assets/icons/bookmark_fill.svg';
import {
  formatCompactCount,
  QV_COLORS,
  qvStyles,
} from './productQuickViewStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
}

const StatPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}> = ({ icon, label, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <Animated.View style={[qvStyles.statPill, animatedStyle]}>
      {icon}
      <Text style={qvStyles.statPillText}>{label}</Text>
    </Animated.View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}>
      {content}
    </AnimatedPressable>
  );
};

export const ProductStatsRow: React.FC<Props> = ({
  likesCount,
  commentsCount,
  sharesCount,
  viewsCount,
  isLiked,
  isSaved,
  onLike,
  onSave,
}) => {

  const iconColor = QV_COLORS.statText; // '#374151'
  const bookmarkScale = useSharedValue(1);
  const bookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  return (
    <View style={qvStyles.statsRow}>
      <StatPill
        icon={
          isLiked ? (
            <HeartFillIcon width={20} height={20} />
          ) : (
            <HeartIcon width={20} height={20} />
          )
        }
        label={String(likesCount)}
        onPress={onLike}
      />
      <StatPill
        icon={<CommentIcon width={20} height={20} />}
        label={String(commentsCount)}
      />
      <StatPill
        icon={<SendIcon width={20} height={20} />}
        label={String(sharesCount)}
      />
      <StatPill
        icon={<ViewIcon width={20} height={20} />}
        label={formatCompactCount(viewsCount)}
      />
      <AnimatedPressable
        style={[qvStyles.bookmarkBtn, bookmarkStyle]}
        onPress={onSave}
        onPressIn={() => {
          bookmarkScale.value = withSpring(0.92);
        }}
        onPressOut={() => {
          bookmarkScale.value = withSpring(1);
        }}
      >
        {isSaved ? (
          <BookmarkFillIcon width={40} height={40} />
        ) : (
          <BookmarkIcon width={20} height={20} />
        )}
      </AnimatedPressable>
    </View>
  );
};
