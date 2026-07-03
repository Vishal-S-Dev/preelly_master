import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CreatePostImageAsset } from '../../../types/createPost.types';
import { filterRenderableCreatePostImages } from '../../../utils/createPostImageUtils';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';

type PhotoGridRow =
  | { type: 'single'; image: CreatePostImageAsset; index: number }
  | { type: 'pair'; images: CreatePostImageAsset[]; indices: number[] };

const buildPhotoRows = (images: CreatePostImageAsset[]): PhotoGridRow[] => {
  const rows: PhotoGridRow[] = [];
  let index = 0;

  while (index < images.length) {
    if (index % 3 === 0) {
      rows.push({ type: 'single', image: images[index], index });
      index += 1;
      continue;
    }

    const pair = images.slice(index, index + 2);
    rows.push({
      type: 'pair',
      images: pair,
      indices: pair.map((_, offset) => index + offset),
    });
    index += pair.length;
  }

  return rows;
};

const withSequentialOrder = (images: CreatePostImageAsset[]): CreatePostImageAsset[] =>
  images.map((image, order) => ({ ...image, order }));

interface Props {
  images: CreatePostImageAsset[];
  onRemove: (id: string) => void;
  onReplace?: (id: string) => void;
  onGrab?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<CreatePostImageAsset>) => void;
  onPhotosChange?: (images: CreatePostImageAsset[]) => void;
  styles: CreatePostStyles;
  readOnly?: boolean;
}

export const PhotoGrid = memo<Props>(
  ({ images, onRemove, onReplace, onGrab, onUpdate, onPhotosChange, styles, readOnly = false }) => {
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [editingImage, setEditingImage] = useState<CreatePostImageAsset | null>(null);
    const [captionDraft, setCaptionDraft] = useState('');

    const renderableImages = useMemo(() => filterRenderableCreatePostImages(images), [images]);
    const rows = useMemo(() => buildPhotoRows(renderableImages), [renderableImages]);

    const notifyChange = useCallback(
      (next: CreatePostImageAsset[]) => {
        onPhotosChange?.(withSequentialOrder(next));
      },
      [onPhotosChange],
    );

    const handleDelete = useCallback(
      (image: CreatePostImageAsset) => {
        Alert.alert('Delete photo', 'Remove this image from your listing?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const next = renderableImages.filter(item => item.id !== image.id);
              onRemove(image.id);
              notifyChange(next);
            },
          },
        ]);
      },
      [notifyChange, onRemove, renderableImages],
    );

    const openCaptionEditor = useCallback((image: CreatePostImageAsset) => {
      setEditingImage(image);
      setCaptionDraft(image.caption ?? '');
    }, []);

    const saveCaption = useCallback(() => {
      if (!editingImage) {
        return;
      }

      const trimmed = captionDraft.trim();
      onUpdate?.(editingImage.id, { caption: trimmed || undefined });
      const next = renderableImages.map(image =>
        image.id === editingImage.id ? { ...image, caption: trimmed || undefined } : image,
      );
      notifyChange(next);
      setEditingImage(null);
      setCaptionDraft('');
    }, [captionDraft, editingImage, notifyChange, onUpdate, renderableImages]);

    const renderActions = (image: CreatePostImageAsset, index: number) => {
      if (readOnly) {
        return null;
      }

      return (
        <View style={gridStyles.actions}>
          <Pressable
            style={gridStyles.actionBtn}
            onPress={() =>
              Alert.alert('Photo options', undefined, [
                { text: 'Replace', onPress: () => onReplace?.(image.id) },
                ...(onGrab ? [{ text: 'Grab', onPress: () => onGrab(image.id) }] : []),
                //{ text: 'Update caption', onPress: () => openCaptionEditor(image) },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel={index === 0 ? 'Edit cover image' : 'Edit image'}
          >
            <Icon name="pencil-outline" size={14} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={gridStyles.actionBtn}
            onPress={() => handleDelete(image)}
            accessibilityRole="button"
            accessibilityLabel={index === 0 ? 'Delete cover image' : 'Delete image'}
          >
            <Icon name="trash-can-outline" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      );
    };

    const renderTile = (image: CreatePostImageAsset, index: number, variant: 'single' | 'half') => (
      <View
        key={image.id}
        style={[
          gridStyles.tileWrap,
          variant === 'single' ? gridStyles.tileWrapSingle : gridStyles.tileWrapHalf,
        ]}
      >
        <Pressable
          style={gridStyles.tile}
          onPress={() => setPreviewUri(image.uri)}
          onLongPress={() => !readOnly && openCaptionEditor(image)}
        >
          <Image
            source={{ uri: image.uri }}
            style={[gridStyles.image, variant === 'half' ? gridStyles.imageHalf : null]}
            resizeMode="cover"
          />
          {renderActions(image, index)}
          {index === 0 ? (
            <View style={gridStyles.coverBadge}>
              <Text style={gridStyles.coverBadgeText}>Cover Image</Text>
            </View>
          ) : null}
        </Pressable>
        {image.caption ? (
          <Pressable onPress={() => !readOnly && openCaptionEditor(image)}>
            <Text style={gridStyles.caption} numberOfLines={2}>
              {image.caption}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );

    if (!renderableImages.length) {
      return null;
    }

    return (
      <>
        <View style={gridStyles.grid}>
          {rows.map((row, rowIndex) => {
            if (row.type === 'single') {
              return (
                <View
                  key={`single-${row.image.id}`}
                  style={[gridStyles.row, rowIndex > 0 ? gridStyles.rowSpaced : null]}
                >
                  {renderTile(row.image, row.index, 'single')}
                </View>
              );
            }

            return (
              <View
                key={`pair-${row.indices.join('-')}`}
                style={[gridStyles.row, gridStyles.pairRow, rowIndex > 0 ? gridStyles.rowSpaced : null]}
              >
                {row.images.map((image, pairIndex) =>
                  renderTile(image, row.indices[pairIndex], 'half'),
                )}
              </View>
            );
          })}
        </View>

        <Modal
          visible={Boolean(previewUri)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewUri(null)}
        >
          <Pressable
            style={gridStyles.previewBackdrop}
            onPress={() => setPreviewUri(null)}
          >
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={gridStyles.previewImage}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </Modal>

        {/*<Modal
          visible={Boolean(editingImage)}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingImage(null)}
        >
          <Pressable style={gridStyles.editBackdrop} onPress={() => setEditingImage(null)}>
            <Pressable style={gridStyles.editCard} onPress={event => event.stopPropagation()}>
              <Text style={gridStyles.editTitle}>Update photo details</Text>
              <Text style={gridStyles.editLabel}>Caption</Text>
              <TextInput
                value={captionDraft}
                onChangeText={setCaptionDraft}
                placeholder="e.g. Front view"
                style={gridStyles.editInput}
                maxLength={120}
              />
              <View style={gridStyles.editActions}>
                <Pressable style={gridStyles.editCancelBtn} onPress={() => setEditingImage(null)}>
                  <Text style={gridStyles.editCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, gridStyles.editSaveBtn]} onPress={saveCaption}>
                  <Text style={styles.primaryBtnText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>*/}
      </>
    );
  },
);

PhotoGrid.displayName = 'PhotoGrid';

const gridStyles = StyleSheet.create({
  grid: {
    marginBottom: 1,
  },
  row: {
    width: '100%',
  },
  rowSpaced: {
    marginTop: 1,
    paddingTop: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECF5',
  },
  pairRow: {
    flexDirection: 'row',
    gap: 1,
  },
  tileWrap: {
    minWidth: 0,
  },
  tileWrapSingle: {
    width: '100%',
  },
  tileWrapHalf: {
    flex: 1,
  },
  tile: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EEF2F8',
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  imageHalf: {
    aspectRatio: 1,
  },
  actions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(33, 53, 124, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  caption: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editCancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  editSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
});
