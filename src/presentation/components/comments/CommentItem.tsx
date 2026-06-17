import React, { memo, useCallback, useState } from 'react';
import { Image, LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { ProductComment } from '../../../domain/models/ProductComment';
import { ReplyItem } from './ReplyItem';
import { cmStyles, CM_COLORS } from './commentsStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  comment: ProductComment;
  index: number;
  formatTime: (date: string) => string;
  onLike: (id: string) => void;
  onReply?: (username: string) => void;
}

export const CommentItem = memo<Props>(({ comment, index, formatTime, onLike, onReply }) => {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const hasReplies = comment.replyCount > 0 || comment.replies.length > 0;

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = useCallback(() => {
    scale.value = withSpring(1.25, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
    onLike(comment.id);
  }, [comment.id, onLike, scale]);

  const toggleReplies = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  return (
    <Animated.View entering={FadeIn.delay(Math.min(index * 40, 200)).duration(280)}>
      <View style={cmStyles.commentRow}>
        <Image
          source={{ uri: comment.user.avatar ?? 'https://i.pravatar.cc/200?img=15' }}
          style={cmStyles.avatar}
        />
        <View style={cmStyles.commentBody}>
          <View style={cmStyles.metaRow}>
            <Text style={cmStyles.username}>{comment.user.name}</Text>
            <Text style={cmStyles.time}>{formatTime(comment.createdAt)}</Text>
            {comment.user.isOwner ? (
              <>
                <Text style={cmStyles.ownerBadge}>Owner</Text>
                <Icon name="pin" size={12} color={CM_COLORS.owner} />
              </>
            ) : null}
          </View>
          <Text style={cmStyles.commentText}>{comment.text}</Text>
          <View style={cmStyles.actionsRow}>
            <Pressable onPress={() => onReply?.(comment.user.name)} hitSlop={8}>
              <Text style={cmStyles.replyBtn}>Reply</Text>
            </Pressable>
          </View>
          {hasReplies && !expanded ? (
            <Pressable onPress={toggleReplies} hitSlop={8}>
              <Text style={cmStyles.viewRepliesBtn}>
                View {comment.replyCount || comment.replies.length}{' '}
                {(comment.replyCount || comment.replies.length) === 1 ? 'reply' : 'replies'}
              </Text>
            </Pressable>
          ) : null}
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
      {expanded
        ? comment.replies.map(reply => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              formatTime={formatTime}
              onLike={onLike}
              onReply={onReply}
            />
          ))
        : null}
      {hasReplies && expanded ? (
        <Pressable onPress={toggleReplies} style={cmStyles.replyIndent} hitSlop={8}>
          <Text style={cmStyles.viewRepliesBtn}>Hide replies</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

CommentItem.displayName = 'CommentItem';
