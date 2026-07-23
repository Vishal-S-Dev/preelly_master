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

  const extra = Math.max(0, attachments.filter(isImageAttachment).length - 4);
  const single = images.length === 1;

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
      <View style={[styles.grid, single ? styles.gridSingle : styles.gridMulti]}>
        {images.map((item, index) => {
          const uri = resolveAttachmentUrl(item.url);
          const isLastWithExtra = index === images.length - 1 && extra > 0;
          return (
            <Pressable
              key={`${item.url}_${index}`}
              style={[
                styles.cell,
                single ? styles.cellSingle : null,
                images.length === 3 && index === 0 ? styles.cellTall : null,
              ]}
              onPress={() => onPressImage?.(index)}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="cover" />
              {isLastWithExtra ? (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{extra}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 244,
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
    overflow: 'hidden',
    borderRadius: 18,
    gap: 2,
  },
  gridSingle: {
    width: 244,
  },
  gridMulti: {
    width: 244,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '49.5%',
    height: 120,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cellSingle: {
    width: '100%',
    height: 220,
  },
  cellTall: {
    height: 242,
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
