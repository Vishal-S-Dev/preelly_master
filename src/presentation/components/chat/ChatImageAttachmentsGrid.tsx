import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatMessageAttachment } from '../../../domain/models/ChatThread';
import {
  isImageAttachment,
  resolveAttachmentUrl,
} from '../../../utils/chatAttachmentUtils';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';

interface Props {
  attachments: ChatMessageAttachment[];
  caption?: string;
  isSelf: boolean;
  dimmed?: boolean;
  onPressImage?: (index: number) => void;
}

const COLLAGE_WIDTH = 260;
const COLLAGE_HEIGHT = 280;
const GAP = 2;

export const ChatImageAttachmentsGrid: React.FC<Props> = ({
  attachments,
  caption,
  isSelf,
  dimmed = false,
  onPressImage,
}) => {
  const images = useMemo(
    () => attachments.filter(isImageAttachment).slice(0, 4),
    [attachments],
  );

  if (!images.length) {
    return null;
  }

  const totalImages = attachments.filter(isImageAttachment).length;
  const extra = Math.max(0, totalImages - 4);
  const count = images.length;

  const renderCell = (
    item: ChatMessageAttachment,
    index: number,
    cellStyle: object,
    showExtra = false,
  ) => {
    const uri = resolveAttachmentUrl(item.url);
    return (
      <Pressable
        key={`${item.url}_${index}`}
        style={[styles.cell, cellStyle]}
        onPress={() => onPressImage?.(index)}
      >
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        {showExtra ? (
          <View style={styles.moreOverlay}>
            <Text style={styles.moreText}>+{extra}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderCollage = () => {
    if (count === 1) {
      return (
        <View style={[styles.grid, styles.gridSingle]}>
          {renderCell(images[0], 0, styles.cellSingle)}
        </View>
      );
    }

    if (count === 2) {
      return (
        <View style={[styles.grid, styles.gridTwo]}>
          {renderCell(images[0], 0, styles.cellHalf)}
          {renderCell(images[1], 1, styles.cellHalf)}
        </View>
      );
    }

    // 3-panel mosaic (reference): left tall + right stacked pair
    if (count === 3) {
      return (
        <View style={[styles.grid, styles.gridThree]}>
          {renderCell(images[0], 0, styles.cellPrimary)}
          <View style={styles.rightColumn}>
            {renderCell(images[1], 1, styles.cellSecondary)}
            {renderCell(images[2], 2, styles.cellSecondary)}
          </View>
        </View>
      );
    }

    // 4 images: 2x2
    return (
      <View style={[styles.grid, styles.gridFour]}>
        {renderCell(images[0], 0, styles.cellQuarter)}
        {renderCell(images[1], 1, styles.cellQuarter)}
        {renderCell(images[2], 2, styles.cellQuarter)}
        {renderCell(images[3], 3, styles.cellQuarter, extra > 0)}
      </View>
    );
  };

  return (
    <View style={[styles.wrap, dimmed ? styles.dimmed : null]}>
      {caption ? (
        <Text
          style={[
            styles.caption,
            { color: isSelf ? THREAD_UI.outgoingText : THREAD_UI.incomingText },
          ]}
        >
          {caption}
        </Text>
      ) : null}
      {renderCollage()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    maxWidth: COLLAGE_WIDTH,
  },
  dimmed: {
    opacity: 0.72,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  grid: {
    width: COLLAGE_WIDTH,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  gridSingle: {
    height: 220,
  },
  gridTwo: {
    height: COLLAGE_HEIGHT,
    flexDirection: 'row',
    gap: GAP,
  },
  gridThree: {
    height: COLLAGE_HEIGHT,
    flexDirection: 'row',
    gap: GAP,
  },
  gridFour: {
    height: COLLAGE_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  rightColumn: {
    flex: 0.4,
    gap: GAP,
  },
  cell: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cellSingle: {
    width: '100%',
    height: '100%',
  },
  cellHalf: {
    flex: 1,
    height: '100%',
  },
  cellPrimary: {
    flex: 0.6,
    height: '100%',
  },
  cellSecondary: {
    flex: 1,
    width: '100%',
  },
  cellQuarter: {
    width: (COLLAGE_WIDTH - GAP) / 2,
    height: (COLLAGE_HEIGHT - GAP) / 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
});
