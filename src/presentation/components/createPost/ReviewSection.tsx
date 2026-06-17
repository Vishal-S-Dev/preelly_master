import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';
import { ReviewRow } from '../../../utils/reviewFormUtils';

interface Props {
  title: string;
  rows: ReviewRow[];
  onEdit?: () => void;
  styles: CreatePostStyles;
}

export const ReviewSection = memo<Props>(({ title, rows, onEdit, styles }) => {
  const visible = rows.filter(row => row.value?.trim());
  if (!visible.length) return null;
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewCardHeader}>
        <Text style={styles.reviewCardTitle}>{title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit}>
            <Text style={styles.reviewEdit}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {visible.map(row => (
        <View key={row.label} style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{row.label}</Text>
          <Text style={styles.reviewValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
});

ReviewSection.displayName = 'ReviewSection';
