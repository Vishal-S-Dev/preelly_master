import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { CreatePostMediaFile } from '../../../types/createPost.types';

interface Props {
  video: CreatePostMediaFile;
  onDelete: () => void;
  onReplace: () => void;
}

export const VideoPreview = memo<Props>(({ video, onDelete, onReplace }) => {
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  // Large picked/trimmed videos can take a moment to buffer their first frame — show a spinner
  // until then instead of a blank black box.
  const [loading, setLoading] = useState(true);
  // Screen stays mounted (pushed underneath) when navigating to the next create-post step,
  // so playback must be gated on focus or it keeps running in the background.
  const isFocused = useIsFocused();

  useEffect(() => {
    setLoading(true);
  }, [video.uri]);

  useEffect(() => {
    if (!isFocused) {
      setPaused(true);
    }
  }, [isFocused]);

  const handleLoad = useCallback(() => setLoading(false), []);

  return (
    <View style={styles.wrap}>
      <Video
        source={{ uri: video.uri }}
        style={styles.video}
        paused={paused || !isFocused}
        muted={muted}
        resizeMode="cover"
        repeat
        onLoad={handleLoad}
      />
      {loading ? (
        <View style={styles.loaderWrap} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {video.duration ? `${Math.round(video.duration)}s` : ''}
          {video.size ? ` · ${(video.size / (1024 * 1024)).toFixed(1)} MB` : ''}
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={() => setPaused(prev => !prev)} style={styles.controlBtn}>
          <Icon name={paused ? 'play' : 'pause'} size={18} color="#fff" />
        </Pressable>
        <Pressable onPress={() => setMuted(prev => !prev)} style={styles.controlBtn}>
          <Icon name={muted ? 'volume-off' : 'volume-high'} size={18} color="#fff" />
        </Pressable>
        <Pressable onPress={onReplace} style={styles.controlBtn}>
          <Icon name="swap-horizontal" size={18} color="#fff" />
        </Pressable>
        <Pressable onPress={onDelete} style={styles.controlBtn}>
          <Icon name="trash-can-outline" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
});

VideoPreview.displayName = 'VideoPreview';

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', marginBottom: 16 },
  video: { width: '100%', aspectRatio: 16 / 9 },
  loaderWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
