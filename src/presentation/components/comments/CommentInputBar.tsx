import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../../../domain/models/User';
import { CommentReplyTarget } from '../../hooks/useProductComments';
import { CommentAvatar } from './CommentAvatar';
import { CM_COLORS, cmStyles } from './commentsStyles';

interface Props {
  user?: User | null;
  isAuthenticated: boolean;
  submitting: boolean;
  onSubmit: (text: string, parentID?: string | null) => Promise<boolean>;
  replyTo?: CommentReplyTarget;
  onClearReply?: () => void;
}

export const CommentInputBar = memo<Props>(
  ({
    user,
    isAuthenticated,
    submitting,
    onSubmit,
    replyTo,
    onClearReply,
  }) => {
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const sendScale = useSharedValue(1);

    const sendAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: sendScale.value }],
    }));

    const canSend = text.trim().length > 0 && !submitting;

    useEffect(() => {
      // Keep draft when switching reply targets; only clear on successful send.
    }, [replyTo?.id]);

    const handleSend = useCallback(async () => {
      if (!canSend) {
        return;
      }
      sendScale.value = withSpring(0.88, { damping: 10 }, () => {
        sendScale.value = withSpring(1);
      });
      const ok = await onSubmit(text.trim(), replyTo?.id ?? null);
      if (ok) {
        setText('');
        onClearReply?.();
      }
    }, [canSend, onClearReply, onSubmit, replyTo?.id, sendScale, text]);

    if (!isAuthenticated) {
      return (
        <View style={[cmStyles.footerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={cmStyles.loginHint}>Log in to add a comment</Text>
        </View>
      );
    }

    const placeholder = replyTo
      ? `Reply to ${replyTo.username}...`
      : 'Add a comment';

    return (
      <View style={[cmStyles.footerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {replyTo ? (
          <View style={cmStyles.replyBanner}>
            <Text style={cmStyles.replyBannerText} numberOfLines={1}>
              Replying to <Text style={cmStyles.replyBannerName}>{replyTo.username}</Text>
            </Text>
            <Pressable onPress={onClearReply} hitSlop={10} accessibilityLabel="Cancel reply">
              <Icon name="close" size={18} color={CM_COLORS.muted} />
            </Pressable>
          </View>
        ) : null}
        <View style={cmStyles.inputRow}>
          <CommentAvatar avatar={user?.avatar} size={34} style={cmStyles.inputAvatar} />
          <View style={cmStyles.inputShell}>
            <BottomSheetTextInput
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor={CM_COLORS.inputPlaceholder}
              style={cmStyles.input}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            {canSend ? (
              <Animated.View style={sendAnimStyle}>
                <Pressable
                  onPress={handleSend}
                  disabled={!canSend}
                  style={cmStyles.sendInlineBtn}
                  accessibilityLabel="Send comment"
                >
                  {submitting ? (
                    <ActivityIndicator color={CM_COLORS.title} size="small" />
                  ) : (
                    <Icon name="send" size={18} color={CM_COLORS.title} />
                  )}
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable hitSlop={10} accessibilityLabel="Emoji">
                <Icon name="emoticon-happy-outline" size={22} color={CM_COLORS.muted} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  },
);

CommentInputBar.displayName = 'CommentInputBar';
