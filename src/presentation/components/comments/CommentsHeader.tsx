import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cmStyles } from './commentsStyles';

interface Props {
  totalCount: number;
  onClose?: () => void;
}

export const CommentsHeader = memo<Props>(({ totalCount, onClose }) => (
  <View style={cmStyles.header}>
    <View style={cmStyles.headerRow}>
      <Text style={cmStyles.headerTitle}>Comments</Text>
      {totalCount > 0 ? (
        <Text style={cmStyles.headerCount}>({totalCount})</Text>
      ) : null}
      {onClose ? (
        <Pressable
          onPress={onClose}
          style={cmStyles.closeBtn}
          hitSlop={12}
          accessibilityLabel="Close comments">
          <Icon name="close" size={22} color="#6B7280" />
        </Pressable>
      ) : null}
    </View>
  </View>
));

CommentsHeader.displayName = 'CommentsHeader';
