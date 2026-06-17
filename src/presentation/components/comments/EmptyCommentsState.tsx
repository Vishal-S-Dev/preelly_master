import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CM_COLORS, cmStyles } from './commentsStyles';

export const EmptyCommentsState = memo(() => (
  <View style={cmStyles.emptyWrap}>
    <Icon name="comment-text-outline" size={56} color={CM_COLORS.emptyIcon} />
    <Text style={cmStyles.emptyTitle}>No comments yet</Text>
    <Text style={cmStyles.emptySubtitle}>
      Be the first to share your thoughts on this listing.
    </Text>
  </View>
));

EmptyCommentsState.displayName = 'EmptyCommentsState';
