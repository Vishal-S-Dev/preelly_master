import React, { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cpStyles } from './createPostStyles';

interface Props {
  uploadProgress: number;
  transcriptionProgress: number;
  extractionProgress: number;
  label?: string;
}

export const UploadProgress = memo<Props>(
  ({ uploadProgress, transcriptionProgress, extractionProgress, label }) => (
    <View style={{ paddingVertical: 24 }}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={[cpStyles.sectionTitle, { textAlign: 'center', marginTop: 16 }]}>
        {label ?? 'Processing your listing...'}
      </Text>
      <ProgressRow label="Uploading video" value={uploadProgress} />
      <ProgressRow label="Generating transcript" value={transcriptionProgress} />
      <ProgressRow label="Extracting details" value={extractionProgress} />
    </View>
  ),
);

const ProgressRow = memo<{ label: string; value: number }>(({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={{ color: '#6B7280', marginBottom: 6 }}>{label}</Text>
    <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 999 }}>
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: 8,
          backgroundColor: '#2563EB',
          borderRadius: 999,
        }}
      />
    </View>
  </View>
));

UploadProgress.displayName = 'UploadProgress';
