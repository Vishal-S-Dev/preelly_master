import React, { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../../../assets/icons/app_icon.svg';
import AppSubtitle from '../../../../assets/icons/app_sub_title.svg';
import { AUTH_COLORS, loginScreenStyles as styles } from '../../screens/auth/loginScreenStyles';

const LOGO_WIDTH = wp('58%');
const LOGO_HEIGHT = hp('6.5%');
const TAGLINE_WIDTH = wp('38%');
const TAGLINE_HEIGHT = hp('2.4%');

interface Props {
  children: ReactNode;
}

export const AuthScreenLayout: React.FC<Props> = ({ children }) => {
  const logoScale = useSharedValue(0.9);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [logoScale]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <LinearGradient
          colors={[AUTH_COLORS.gradientStart, AUTH_COLORS.gradientMid, AUTH_COLORS.gradientEnd]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerSection}>
          <SafeAreaView edges={['top']} style={styles.logoWrap}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={[logoAnimatedStyle, { alignItems: 'center' }]}>
              <AppIcon width={LOGO_WIDTH} height={LOGO_HEIGHT} />
              <View style={{ marginTop: hp('1.4%') }}>
                <AppSubtitle
                  width={TAGLINE_WIDTH}
                  height={TAGLINE_HEIGHT}
                  style={styles.slogan}
                />
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        <Animated.View entering={FadeInDown.delay(120).duration(520)} style={styles.cardSection}>
          <View style={styles.card}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.scrollContent}>
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};
