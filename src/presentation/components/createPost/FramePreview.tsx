import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Video, { OnLoadData, OnProgressData, OnSeekData, VideoRef } from 'react-native-video';
import { CreatePostMediaFile } from '../../../types/createPost.types';

interface Props {
  video: CreatePostMediaFile;
  videoRef: React.RefObject<VideoRef | null>;
  onLoad: (meta: OnLoadData) => void;
  onProgress: (progress: OnProgressData) => void;
  onSeek: (data: OnSeekData) => void;
  onError: () => void;
}

export const FramePreview = memo<Props>(
  ({ video, videoRef, onLoad, onProgress, onSeek, onError }) => (
    <View style={styles.container}>
      <View style={styles.previewWrap}>
        <Video
          ref={videoRef}
          source={{ uri: video.uri }}
          style={styles.video}
          resizeMode="contain"
          paused
          onLoad={onLoad}
          onProgress={onProgress}
          onSeek={onSeek}
          progressUpdateInterval={50}
          onError={onError}
        />
      </View>
    </View>
  ),
);

FramePreview.displayName = 'FramePreview';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    minHeight: 260,
  },
  previewWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
