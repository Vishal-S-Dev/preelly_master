import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useIsReelPlaybackAllowed } from '../context/ReelPlaybackContext';
import { REEL_IOS_VIDEO_AUDIO_PROPS } from '../utils/reelVideoAudioProps';

interface Props {
  videoUrl: string;
  imageUrl: string;
  isActive: boolean;
  muted: boolean;
  isPaused: boolean;
  bottomInset?: number;
}

const VideoPlayerComponent: React.FC<Props> = ({
  videoUrl,
  imageUrl,
  isActive,
  muted,
  isPaused,
  bottomInset = 0,
}) => {
  const isPlaybackAllowed = useIsReelPlaybackAllowed();
  const videoRef = useRef<VideoRef>(null);
  const currentTimeRef = useRef(0);
  const resumeAfterExternalPauseRef = useRef(false);
  const prevActiveRef = useRef(isActive);

  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  const progress = useSharedValue(0);
  const duration = useSharedValue(0);

  const hasVideo = videoUrl.trim().length > 0;
  const hasPoster = imageUrl.trim().length > 0;
  const shouldPlay =
    hasVideo && isActive && isPlaybackAllowed && !isPaused && !hasError;
  const paused = !shouldPlay;

  const screenWidth = Dimensions.get('window').width;

  const progressStyle = useAnimatedStyle(() => ({
    width: screenWidth * progress.value,
  }));

  const handleBuffer = useCallback(
    ({ isBuffering }: { isBuffering: boolean }) => {
      if (isActive) {
        setBuffering(isBuffering);
      }
    },
    [isActive],
  );

  const handleLoad = useCallback(
    (event: { duration: number }) => {
      duration.value = event.duration;
      progress.value = 0;
      setHasError(false);
      setBuffering(false);

      if (currentTimeRef.current > 0) {
        videoRef.current?.seek(currentTimeRef.current);
      }
    },
    [duration, progress],
  );

  const handleProgress = useCallback(
    (event: { currentTime: number }) => {
      currentTimeRef.current = event.currentTime;
      if (duration.value <= 0) {
        return;
      }
      const nextProgress = event.currentTime / duration.value;
      progress.value = Math.max(0, Math.min(1, nextProgress));
    },
    [duration, progress],
  );

  const handleError = useCallback(() => {
    setHasError(true);
    setBuffering(false);
  }, []);

  // Track focus/background interruptions separately from user tap-pause
  useEffect(() => {
    if (isActive && !isPaused && !isPlaybackAllowed) {
      resumeAfterExternalPauseRef.current = true;
    }
  }, [isActive, isPaused, isPlaybackAllowed]);

  useEffect(() => {
    if (
      shouldPlay &&
      resumeAfterExternalPauseRef.current &&
      currentTimeRef.current > 0
    ) {
      videoRef.current?.seek(currentTimeRef.current);
      resumeAfterExternalPauseRef.current = false;
    }
  }, [shouldPlay]);

  // Retry load when scrolling back to a reel that previously errored
  useEffect(() => {
    if (isActive && !prevActiveRef.current && hasError) {
      setHasError(false);
    }
    prevActiveRef.current = isActive;
  }, [isActive, hasError]);

  // Drop buffering indicator when reel scrolls off-screen
  useEffect(() => {
    if (!isActive) {
      setBuffering(false);
    }
  }, [isActive]);

  if (!hasVideo) {
    if (!hasPoster) {
      return <View style={styles.media} />;
    }
    return <Image source={{ uri: imageUrl }} style={styles.media} resizeMode="cover" />;
  }

  if (hasError) {
    if (!hasPoster) {
      return <View style={styles.media} />;
    }
    return <Image source={{ uri: imageUrl }} style={styles.media} resizeMode="cover" />;
  }

  return (
    <View style={[styles.media, { marginBottom: bottomInset }]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        poster={hasPoster ? imageUrl : undefined}
        posterResizeMode="cover"
        style={styles.media}
        resizeMode="cover"
        paused={paused}
        repeat
        muted={muted}
        playInBackground={false}
        playWhenInactive={false}
        {...REEL_IOS_VIDEO_AUDIO_PROPS}
        onBuffer={handleBuffer}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onError={handleError}
      />
      {buffering && isActive ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
    </View>
  );
};

const arePropsEqual = (prev: Props, next: Props): boolean =>
  prev.videoUrl === next.videoUrl &&
  prev.imageUrl === next.imageUrl &&
  prev.isActive === next.isActive &&
  prev.muted === next.muted &&
  prev.isPaused === next.isPaused &&
  prev.bottomInset === next.bottomInset;

export const VideoPlayer = memo((props: Omit<Props, 'bottomInset'>) => {
  const tabBarHeight = useBottomTabBarHeight();
  return <VideoPlayerComponent {...props} bottomInset={tabBarHeight} />;
}, arePropsEqual);

VideoPlayer.displayName = 'VideoPlayer';

export const VideoPlayerFullscreen = memo((props: Omit<Props, 'bottomInset'>) => {
  return <VideoPlayerComponent {...props} bottomInset={0} />;
}, arePropsEqual);

VideoPlayerFullscreen.displayName = 'VideoPlayerFullscreen';

export { VideoPlayerComponent };

const styles = StyleSheet.create({
  media: { ...StyleSheet.absoluteFill },
  loader: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: 3,
    width: 0,
    backgroundColor: '#FFFFFF',
  },
});
