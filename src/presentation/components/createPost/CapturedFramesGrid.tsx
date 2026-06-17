import React, { memo, useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostImageAsset } from '../../../types/createPost.types';
import { formatVideoTimePrecise } from '../../../utils/videoTime';

export interface CapturedFrame extends CreatePostImageAsset {
  capturedAtSec?: number;
}

interface Props {
  frames: CapturedFrame[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const THUMB_SIZE = 80;

export const CapturedFramesGrid = memo<Props>(({ frames, onRemove, onClearAll }) => {
  const [preview, setPreview] = useState<CapturedFrame | null>(null);

  const closePreview = useCallback(() => setPreview(null), []);

  if (!frames.length) {
    return (
      <View style={styles.emptyState}>
        <Icon name="image-multiple-outline" size={28} color="#3F3F46" />
        <Text style={styles.emptyTitle}>No frames captured yet</Text>
        <Text style={styles.emptySubtitle}>Pause the video, scrub to a moment, then tap Capture.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.counter}>Captured Frames: {frames.length}</Text>
        <Pressable onPress={onClearAll} hitSlop={8} style={styles.clearBtn}>
          <Icon name="delete-sweep-outline" size={16} color="#FF453A" />
          <Text style={styles.clearText}>Clear All</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {frames.map(frame => (
          <Pressable
            key={frame.id}
            style={styles.thumbWrap}
            onPress={() => setPreview(frame)}
            accessibilityLabel="Preview captured frame">
            <Image source={{ uri: frame.uri }} style={styles.thumb} resizeMode="cover" />
            {typeof frame.capturedAtSec === 'number' ? (
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{formatVideoTimePrecise(frame.capturedAtSec)}</Text>
              </View>
            ) : null}
            <Pressable
              style={styles.deleteBtn}
              hitSlop={6}
              onPress={event => {
                event.stopPropagation?.();
                onRemove(frame.id);
              }}
              accessibilityLabel="Remove captured frame">
              <Icon name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </Pressable>
        ))}
      </View>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.previewBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePreview} />
          <View style={styles.previewCard}>
            {preview ? (
              <>
                <Image source={{ uri: preview.uri }} style={styles.previewImage} resizeMode="contain" />
                {typeof preview.capturedAtSec === 'number' ? (
                  <Text style={styles.previewMeta}>Captured at {formatVideoTimePrecise(preview.capturedAtSec)}</Text>
                ) : null}
                <View style={styles.previewActions}>
                  <Pressable style={styles.previewActionBtn} onPress={closePreview}>
                    <Text style={styles.previewActionText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.previewActionBtn, styles.previewDeleteBtn]}
                    onPress={() => {
                      onRemove(preview.id);
                      closePreview();
                    }}>
                    <Icon name="trash-can-outline" size={16} color="#FF453A" />
                    <Text style={[styles.previewActionText, styles.previewDeleteText]}>Remove</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
});

CapturedFramesGrid.displayName = 'CapturedFramesGrid';

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  counter: {
    color: '#F4F4F5',
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  clearText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 6,
  },
  emptyTitle: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 20,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewImage: {
    width: '100%',
    height: 360,
    backgroundColor: '#000',
  },
  previewMeta: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  previewActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  previewActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  previewActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  previewDeleteBtn: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  previewDeleteText: {
    color: '#FF453A',
  },
});
