import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PendingChatAttachment } from '../../../utils/chatAttachmentUtils';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';

interface Props {
  attachments: PendingChatAttachment[];
  onRemove: (id: string) => void;
}

export const ChatAttachmentPreviewBar: React.FC<Props> = ({ attachments, onRemove }) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {attachments.map(item => (
          <View key={item.id} style={styles.item}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <Pressable
              style={styles.removeBtn}
              hitSlop={8}
              onPress={() => onRemove(item.id)}
              accessibilityLabel="Remove attachment"
            >
              <Icon name="close" size={14} color="#FFF" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.hint}>{attachments.length} photo{attachments.length === 1 ? '' : 's'} selected</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THREAD_UI.divider,
    backgroundColor: '#FFF',
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 12,
    gap: 10,
  },
  item: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,24,39,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: 6,
    paddingHorizontal: 16,
    fontSize: 12,
    color: THREAD_UI.textMuted,
    fontWeight: '600',
  },
});
