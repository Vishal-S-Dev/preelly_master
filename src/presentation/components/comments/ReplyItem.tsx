import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ProductComment } from '../../../domain/models/ProductComment';
import { cmStyles, CM_COLORS } from './commentsStyles';

interface Props {
  reply: ProductComment;
  formatTime: (date: string) => string;
  onLike: (id: string) => void;
  onReply?: (username: string) => void;
}

export const ReplyItem = memo<Props>(({ reply, formatTime, onLike, onReply }) => {
  const scale = useSharedValue(1);

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = () => {
    scale.value = withSpring(1.25, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
    onLike(reply.id);
  };

  return (
    <View style={[cmStyles.commentRow, cmStyles.replyIndent]}>
      <Image
        source={{ uri: reply.user.avatar ?? 'https://i.pravatar.cc/200?img=12' }}
        style={cmStyles.avatar}
      />
      <View style={cmStyles.commentBody}>
        <View style={cmStyles.metaRow}>
          <Text style={cmStyles.username}>{reply.user.name}</Text>
          <Text style={cmStyles.time}>{formatTime(reply.createdAt)}</Text>
          {reply.user.isOwner ? (
            <>
              <Text style={cmStyles.ownerBadge}>Owner</Text>
              <Icon name="pin" size={12} color={CM_COLORS.owner} />
            </>
          ) : null}
        </View>
        <Text style={cmStyles.commentText}>{reply.text}</Text>
        <View style={cmStyles.actionsRow}>
          <Pressable onPress={() => onReply?.(reply.user.name)} hitSlop={8}>
            <Text style={cmStyles.replyBtn}>Reply</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={handleLike} style={cmStyles.likeColumn} hitSlop={10}>
        <Animated.View style={likeAnimStyle}>
          <Icon
            name={reply.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={reply.isLiked ? CM_COLORS.heartActive : CM_COLORS.heart}
          />
        </Animated.View>
        {reply.likeCount > 0 ? (
          <Text style={cmStyles.likeCount}>{reply.likeCount}</Text>
        ) : null}
      </Pressable>
    </View>
  );
});

ReplyItem.displayName = 'ReplyItem';
