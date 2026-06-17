import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CallIcon from '../../../../assets/icons/call.svg';
import WhatsappIcon from '../../../../assets/icons/whatsapp.svg';
import ChatIcon from '../../../../assets/icons/chat.svg';
import { QV_COLORS, qvStyles } from './productQuickViewStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onCall?: () => void;
  onWhatsApp?: () => void;
  onChat?: () => void;
  showCall?: boolean;
  showWhatsApp?: boolean;
  showChat?: boolean;
}

const ActionButton: React.FC<{
  backgroundColor: string;
  icon: React.ReactNode;
  onPress?: () => void;
}> = ({ backgroundColor, icon, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[qvStyles.actionBtn, { backgroundColor }, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}>
      {icon}
    </AnimatedPressable>
  );
};

export const ProductBottomActions: React.FC<Props> = ({
  onCall,
  onWhatsApp,
  onChat,
  showCall = true,
  showWhatsApp = true,
  showChat = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        qvStyles.bottomActions,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}>
      {showCall ? (
        <ActionButton
          backgroundColor={QV_COLORS.callBg}
          icon={<CallIcon width={22} height={22} />}
          onPress={onCall}
        />
      ) : null}
      {showWhatsApp ? (
        <ActionButton
          backgroundColor={QV_COLORS.whatsappBg}
          icon={<WhatsappIcon width={22} height={22} />}
          onPress={onWhatsApp}
        />
      ) : null}
      {showChat ? (
        <ActionButton
          backgroundColor={QV_COLORS.chatBg}
          icon={<ChatIcon width={22} height={22} />}
          onPress={onChat}
        />
      ) : null}
    </Animated.View>
  );
};
