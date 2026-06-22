import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { VIDEO_CONSTRAINTS } from '../../../constants/createPostConstants';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostMediaFile } from '../../../types/createPost.types';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { useVideoFrameCapture } from '../../hooks/useVideoFrameCapture';
import { CaptureButton } from './CaptureButton';
import { CapturedFrame, CapturedFramesGrid } from './CapturedFramesGrid';
import { FramePreview } from './FramePreview';
import { ThumbnailScrubber } from './ThumbnailScrubber';

interface Props {
  visible: boolean;
  video: CreatePostMediaFile | null;
  onClose: () => void;
}

export const VideoFramePickerModal = memo<Props>(({ visible, video, onClose }) => {
  const insets = useStableSafeAreaInsets();
  const { images, addImages, removeImage, subcategoryName } = useCreatePostStore();
  const [sessionCaptures, setSessionCaptures] = useState<CapturedFrame[]>([]);

  const {
    videoRef,
    currentTime,
    capturing,
    videoError,
    frames,
    remaining,
    scrubberReady,
    thumbnailsLoading,
    canCapture,
    onLoad,
    onProgress,
    onSeek,
    onScrub,
    onScrubEnd,
    onVideoError,
    captureFrame,
  } = useVideoFrameCapture({
    video,
    visible,
    imageCount: images.length,
  });

  useEffect(() => {
    if (!visible) {
      setSessionCaptures([]);
    }
  }, [visible]);

  const handleCapture = useCallback(async () => {
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${VIDEO_CONSTRAINTS.maxImages} photos allowed.`);
      return;
    }

    const uri = await captureFrame();
    if (!uri) {
      Alert.alert(
        'Capture failed',
        'Could not extract this frame. Try scrubbing to a different moment.',
      );
      return;
    }

    const asset: CapturedFrame = {
      id: `frame_${Date.now()}_${Math.round(currentTime * 1000)}`,
      uri,
      fromVideo: true,
      capturedAtSec: currentTime,
    };
    addImages([asset]);
    setSessionCaptures(prev => [...prev, asset]);
  }, [addImages, captureFrame, currentTime, remaining]);

  const handleRemoveCapture = useCallback(
    (id: string) => {
      setSessionCaptures(prev => prev.filter(frame => frame.id !== id));
      removeImage(id);
    },
    [removeImage],
  );

  if (!video) return null;

  const title = subcategoryName?.trim() || 'Screen Grab';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View
        style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cancel" style={styles.topAction}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Done" style={styles.topAction}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        {videoError ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{videoError}</Text>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.previewSection}>
              <FramePreview
                video={video}
                videoRef={videoRef}
                onLoad={onLoad}
                onProgress={onProgress}
                onSeek={onSeek}
                onError={onVideoError}
              />
            </View>

            <View style={styles.bottomSection}>
              <CapturedFramesGrid
                frames={sessionCaptures}
                onRemove={handleRemoveCapture}
                maxVisible={VIDEO_CONSTRAINTS.maxImages}
              />

              {scrubberReady ? (
                <ThumbnailScrubber
                  frames={frames}
                  currentTimeSec={currentTime}
                  onScrub={onScrub}
                  onScrubEnd={onScrubEnd}
                />
              ) : (
                <View style={styles.scrubberLoading}>
                  <ActivityIndicator color="#0000FF" />
                  <Text style={styles.scrubberLoadingText}>
                    {thumbnailsLoading ? 'Generating thumbnails…' : 'Preparing timeline…'}
                  </Text>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.remaining}>
                  {remaining > 0
                    ? `${remaining} photo slot${remaining === 1 ? '' : 's'} remaining`
                    : 'Photo limit reached'}
                </Text>
                <CaptureButton
                  disabled={!canCapture}
                  loading={capturing}
                  onPress={handleCapture}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
});

VideoFramePickerModal.displayName = 'VideoFramePickerModal';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  topAction: {
    minWidth: 68,
  },
  cancelText: {
    color: '#0000FF',
    fontSize: 17,
    fontWeight: '400',
  },
  doneText: {
    color: '#0000FF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  topTitle: {
    flex: 1,
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  body: {
    flex: 1,
  },
  previewSection: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  scrubberLoading: {
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  scrubberLoadingText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  remaining: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '400',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 15,
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  secondaryBtnText: {
    color: '#000000',
    fontWeight: '600',
  },
});
