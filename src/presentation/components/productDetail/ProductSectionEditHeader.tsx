import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pdStyles } from './productDetailStyles';

interface Props {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
}

export const ProductSectionEditHeader = memo<Props>(
  ({ title, onEdit, editLabel = 'Edit' }) => (
    <View style={headerStyles.row}>
      <Text style={[pdStyles.sectionTitle, headerStyles.title]}>{title}</Text>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${editLabel} ${title}`}>
          <Text style={headerStyles.editText}>{editLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  ),
);

ProductSectionEditHeader.displayName = 'ProductSectionEditHeader';

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    marginBottom: 0,
    flex: 1,
  },
  editText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
});
