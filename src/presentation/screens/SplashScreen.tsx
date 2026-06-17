import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import GradientBg from '../../../assets/icons/gradiant_bg.svg';
import AppIcon from '../../../assets/icons/app_icon.svg';
import AppSubTitle from '../../../assets/icons/app_sub_title.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SplashScreen: React.FC = () => (
  <View style={styles.container}>
    <GradientBg
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      style={styles.background}
      preserveAspectRatio="xMidYMid slice"
    />
    <View style={styles.content}>
      <AppIcon width={SCREEN_WIDTH * 0.51} height={SCREEN_WIDTH * 0.32} />

      <ActivityIndicator color="#FFFFFF" style={styles.loader} size="large" />
    </View>
    <AppSubTitle  width={SCREEN_WIDTH * 0.32} height={SCREEN_WIDTH * 0.16} style={styles.slogan}/>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0000FF',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 32,
  },
  slogan: {
    position: "absolute",
    bottom: 0,
    flex : 1,
    alignSelf : "center"
  },
});
