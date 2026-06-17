import React, { memo } from 'react';
import { View } from 'react-native';
import { cmStyles } from './commentsStyles';

const SkeletonRow = memo(() => (
  <View style={cmStyles.skeletonRow}>
    <View style={cmStyles.skeletonCircle} />
    <View style={cmStyles.skeletonBlock}>
      <View style={[cmStyles.skeletonLine, { width: '35%' }]} />
      <View style={[cmStyles.skeletonLine, { width: '90%' }]} />
      <View style={[cmStyles.skeletonLine, { width: '70%' }]} />
    </View>
  </View>
));

SkeletonRow.displayName = 'CommentSkeletonRow';

export const CommentSkeletonList = memo(() => (
  <View>
    {Array.from({ length: 6 }).map((_, index) => (
      <SkeletonRow key={`sk_${index}`} />
    ))}
  </View>
));

CommentSkeletonList.displayName = 'CommentSkeletonList';
