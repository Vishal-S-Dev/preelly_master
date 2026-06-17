import React, { memo } from 'react';
import { View } from 'react-native';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';

interface Props {
  count?: number;
}

export const SubcategoryListSkeleton = memo<Props>(({ count = 5 }) => {
  const styles = useCreatePostStyles();

  return (
    <View style={{ marginTop: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonLine} />
      ))}
    </View>
  );
});

SubcategoryListSkeleton.displayName = 'SubcategoryListSkeleton';
