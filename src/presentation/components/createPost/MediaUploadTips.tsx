import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import MultiAngleIcon from '../../../../assets/icons/ic_multiple_angle.svg';
import { cpStyles } from './createPostStyles';

const VIDEO_TIPS = [
  'Show the item from multiple angles',
  'Film in bright, even lighting',
  'Keep the camera steady while recording',
  'Highlight key features and condition',
  'Keep the video under 2 minutes',
] as const;

const AUTO_ADVANCE_MS = 4200;

export const MediaUploadTips = memo(() => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setIndex(prev => (prev + 1) % VIDEO_TIPS.length);
    }, AUTO_ADVANCE_MS);
  }, [clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [clearTimer, startTimer]);

  const onSelectDot = useCallback(
    (next: number) => {
      setIndex(next);
      startTimer();
    },
    [startTimer],
  );

  return (
    <View style={cpStyles.mediaTipsWrap}>
      <Text style={cpStyles.mediaTipsHeading}>Tips for a great video</Text>

      <View style={cpStyles.mediaTipRow}>
        <MultiAngleIcon width={20} height={20} />
        <Animated.Text
          key={index}
          entering={FadeIn.duration(240)}
          style={cpStyles.mediaTipLabel}
        >
          {VIDEO_TIPS[index]}
        </Animated.Text>
      </View>

      <View style={cpStyles.mediaTipDots}>
        {VIDEO_TIPS.map((_, dotIndex) => {
          const active = dotIndex === index;
          return (
            <Pressable
              key={`tip-dot-${dotIndex}`}
              onPress={() => onSelectDot(dotIndex)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Tip ${dotIndex + 1}`}
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  cpStyles.mediaTipDot,
                  active && cpStyles.mediaTipDotActive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

MediaUploadTips.displayName = 'MediaUploadTips';
