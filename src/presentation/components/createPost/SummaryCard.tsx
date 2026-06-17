import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cpStyles } from './createPostStyles';

interface Row {
  label: string;
  value?: string;
}

interface Props {
  rows: Row[];
  onEdit?: () => void;
}

export const SummaryCard = memo<Props>(({ rows, onEdit }) => (
  <View style={cpStyles.summaryCard}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={cpStyles.sectionTitle}>Listing Summary</Text>
      {onEdit ? (
        <Pressable onPress={onEdit}>
          <Text style={{ color: '#2563EB', fontWeight: '700' }}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
    {rows.map(row => (
      <View key={row.label} style={cpStyles.summaryRow}>
        <Text style={cpStyles.summaryLabel}>{row.label}</Text>
        <Text style={cpStyles.summaryValue}>{row.value || '—'}</Text>
      </View>
    ))}
  </View>
));

SummaryCard.displayName = 'SummaryCard';
