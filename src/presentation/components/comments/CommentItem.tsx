import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ProductComment } from '../../../domain/models/ProductComment';
import { fontText } from '../../../utils/fonts';
import { CommentAvatar } from './CommentAvatar';
import { ReplyItem } from './ReplyItem';
import { cmStyles, CM_COLORS } from './commentsStyles';

interface Props {
  comment: ProductComment;
  index: number;
  formatTime: (date: string) => string;
  onLike: (id: string) => void;
  onReply?: (commentId: string, username: string) => void;
}

export const CommentItem = memo<Props>(
  ({ comment, index, formatTime, onLike, onReply }) => {
    const scale = useSharedValue(1);

    const likeAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handleLike = useCallback(() => {
      scale.value = withSpring(1.25, { damping: 8 }, () => {
        scale.value = withSpring(1);
      });
      onLike(comment.id);
    }, [comment.id, onLike, scale]);

    const displayName = comment.user.username || comment.user.name;

    return (
      <Animated.View entering={FadeIn.delay(Math.min(index * 40, 200)).duration(280)}>
        <View style={cmStyles.commentRow}>
          <CommentAvatar avatar={comment.user.avatar} size={34} />
          <View style={cmStyles.commentBody}>
            <View style={cmStyles.metaRow}>
              <Text style={[fontText.bold13, cmStyles.username]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={cmStyles.time}>{formatTime(comment.createdAt)}</Text>
              {comment.user.isOwner ? (
                <>
                  <Text style={cmStyles.ownerBadge}>Owner</Text>
                  <Icon name="pin" size={12} color={CM_COLORS.owner} />
                </>
              ) : null}
            </View>
            <Text style={[fontText.regular15, cmStyles.commentText]}>{comment.text}</Text>
            <View style={cmStyles.actionsRow}>
              <Pressable
                onPress={() => onReply?.(comment.id, displayName)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Reply to ${displayName}`}
              >
                <Text style={cmStyles.replyBtn}>Reply</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={handleLike} style={cmStyles.likeColumn} hitSlop={10}>
            <Animated.View style={likeAnimStyle}>
              <Icon
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={comment.isLiked ? CM_COLORS.heartActive : CM_COLORS.heart}
              />
            </Animated.View>
            {comment.likeCount > 0 ? (
              <Text style={cmStyles.likeCount}>{comment.likeCount}</Text>
            ) : null}
          </Pressable>
        </View>

        {comment.replies.map(reply => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            formatTime={formatTime}
            onLike={onLike}
            onReply={onReply}
            depth={1}
          />
        ))}
      </Animated.View>
    );
  },
);

CommentItem.displayName = 'CommentItem';
