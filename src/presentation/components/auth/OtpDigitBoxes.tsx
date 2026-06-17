import React, { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { otpBoxStyles as styles } from '../../screens/auth/verifyOtpScreenStyles';

const OTP_LENGTH = 6;

interface OtpDigitBoxesProps {
  value: string;
  onChange: (otp: string) => void;
}

export const OtpDigitBoxes: React.FC<OtpDigitBoxesProps> = ({ value, onChange }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const setDigitAt = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    onChange(next.join('').replace(/\s/g, ''));
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      setDigitAt(index, '');
      return;
    }
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH - index);
      const next = [...digits];
      pasted.split('').forEach((d, i) => {
        if (index + i < OTP_LENGTH) {
          next[index + i] = d;
        }
      });
      onChange(next.join('').replace(/\s/g, ''));
      const focusIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    setDigitAt(index, cleaned);
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigitAt(index - 1, '');
    }
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((digit, index) => (
        <OtpBox
          key={`otp-${index}`}
          digit={digit}
          inputRef={ref => {
            inputRefs.current[index] = ref;
          }}
          onPress={() => inputRefs.current[index]?.focus()}
          onChangeText={text => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
        />
      ))}
    </View>
  );
};

interface OtpBoxProps {
  digit: string;
  inputRef: (ref: TextInput | null) => void;
  onPress: () => void;
  onChangeText: (text: string) => void;
  onKeyPress: (e: { nativeEvent: { key: string } }) => void;
}

const OtpBox: React.FC<OtpBoxProps> = ({
  digit,
  inputRef,
  onPress,
  onChangeText,
  onKeyPress,
}) => {
  const [focused, setFocused] = React.useState(false);
  const focusProgress = useSharedValue(0);

  React.useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, focusProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusProgress.value * 0.04 }],
    borderColor: focused
      ? '#1E4DFF'
      : digit
        ? '#1E4DFF'
        : '#D8E0EF',
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.box,
          animatedStyle,
          digit ? styles.boxFilled : null,
          focused ? styles.boxFocused : null,
        ]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={digit}
          placeholder="-"
          placeholderTextColor="#B8C4D6"
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      </Animated.View>
    </Pressable>
  );
};
