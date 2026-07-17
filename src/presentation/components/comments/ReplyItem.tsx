import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ProductComment } from '../../../domain/models/ProductComment';
import { fontText } from '../../../utils/fonts';
import { CommentAvatar } from './CommentAvatar';
import { cmStyles, CM_COLORS } from './commentsStyles';

interface Props {
  reply: ProductComment;
  formatTime: (date: string) => string;
  onLike: (id: string) => void;
  onReply?: (commentId: string, username: string) => void;
  depth?: number;
}

export const ReplyItem = memo<Props>(
  ({ reply, formatTime, onLike, onReply, depth = 1 }) => {
    const scale = useSharedValue(1);

    const likeAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handleLike = useCallback(() => {
      scale.value = withSpring(1.25, { damping: 8 }, () => {
        scale.value = withSpring(1);
      });
      onLike(reply.id);
    }, [onLike, reply.id, scale]);

    return (
      <View>
        <View
          style={[
            cmStyles.commentRow,
            depth === 1 ? cmStyles.replyIndent : cmStyles.nestedReplyIndent,
          ]}
        >
          <CommentAvatar avatar={reply.user.avatar} size={32} />
          <View style={cmStyles.commentBody}>
            <View style={cmStyles.metaRow}>
              <Text style={[fontText.bold13, cmStyles.username]} numberOfLines={1}>
                {reply.user.username || reply.user.name}
              </Text>
              <Text style={cmStyles.time}>{formatTime(reply.createdAt)}</Text>
              {reply.user.isOwner ? (
                <>
                  <Text style={cmStyles.ownerBadge}>Owner</Text>
                  <Icon name="pin" size={12} color={CM_COLORS.owner} />
                </>
              ) : null}
            </View>
            <Text style={[fontText.regular15, cmStyles.commentText]}>{reply.text}</Text>
            <View style={cmStyles.actionsRow}>
              <Pressable
                onPress={() =>
                  onReply?.(reply.id, reply.user.username || reply.user.name)
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Reply to ${reply.user.name}`}
              >
                <Text style={cmStyles.replyBtn}>Reply</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={handleLike} style={cmStyles.likeColumn} hitSlop={10}>
            <Animated.View style={likeAnimStyle}>
              <Icon
                name={reply.isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={reply.isLiked ? CM_COLORS.heartActive : CM_COLORS.heart}
              />
            </Animated.View>
            {reply.likeCount > 0 ? (
              <Text style={cmStyles.likeCount}>{reply.likeCount}</Text>
            ) : null}
          </Pressable>
        </View>

        {reply.replies.map(child => (
          <ReplyItem
            key={child.id}
            reply={child}
            formatTime={formatTime}
            onLike={onLike}
            onReply={onReply}
            depth={depth + 1}
          />
        ))}
      </View>
    );
  },
);

ReplyItem.displayName = 'ReplyItem';
