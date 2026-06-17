import React, { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../../../domain/models/User';
import { cmStyles } from './commentsStyles';

interface Props {
  user?: User | null;
  isAuthenticated: boolean;
  submitting: boolean;
  onSubmit: (text: string) => Promise<boolean>;
  replyToUsername?: string | null;
  onClearReply?: () => void;
}

export const CommentInputBar = memo<Props>(
  ({
    user,
    isAuthenticated,
    submitting,
    onSubmit,
    replyToUsername,
    onClearReply,
  }) => {
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const sendScale = useSharedValue(1);

    const sendAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: sendScale.value }],
    }));

    const canSend = text.trim().length > 0 && !submitting;

    const handleSend = useCallback(async () => {
      if (!canSend) {
        return;
      }
      sendScale.value = withSpring(0.88, { damping: 10 }, () => {
        sendScale.value = withSpring(1);
      });
      const payload = replyToUsername
        ? `@${replyToUsername} ${text.trim()}`
        : text.trim();
      const ok = await onSubmit(payload);
      if (ok) {
        setText('');
        onClearReply?.();
      }
    }, [canSend, onClearReply, onSubmit, replyToUsername, sendScale, text]);

    if (!isAuthenticated) {
      return (
        <View style={[cmStyles.footerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={cmStyles.loginHint}>Log in to add a comment</Text>
        </View>
      );
    }

    const placeholder = replyToUsername
      ? `Reply to ${replyToUsername}...`
      : 'Add a comment...';

    return (
      <View style={[cmStyles.footerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {replyToUsername ? (
          <Pressable onPress={onClearReply} style={{ marginBottom: 8 }}>
            <Text style={cmStyles.replyBtn}>
              Replying to {replyToUsername} · Cancel
            </Text>
          </Pressable>
        ) : null}
        <View style={cmStyles.inputRow}>
          <Image
            source={{ uri: user?.avatar ?? 'https://i.pravatar.cc/200?img=8' }}
            style={cmStyles.inputAvatar}
          />
          <View style={cmStyles.inputShell}>
            <BottomSheetTextInput
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              style={cmStyles.input}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable hitSlop={10} accessibilityLabel="Emoji">
              <Icon name="emoticon-happy-outline" size={22} color="#9CA3AF" />
            </Pressable>
          </View>
          <Animated.View style={sendAnimStyle}>
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={[cmStyles.sendBtn, !canSend && cmStyles.sendBtnDisabled]}
              accessibilityLabel="Send comment">
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Icon name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  },
);

CommentInputBar.displayName = 'CommentInputBar';
