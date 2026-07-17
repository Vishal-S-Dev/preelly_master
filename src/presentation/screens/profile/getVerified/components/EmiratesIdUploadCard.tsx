import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GV_COLORS, gvStyles } from '../getVerifiedStyles';

interface Props {
  label: string;
  imageUri?: string | null;
  onUpload: () => void;
  onDelete: () => void;
  onRetake: () => void;
  disabled?: boolean;
}

export const EmiratesIdUploadCard = memo<Props>(
  ({ label, imageUri, onUpload, onDelete, onRetake, disabled = false }) => {
    const hasImage = Boolean(imageUri);

    return (
      <Pressable
        style={gvStyles.uploadCard}
        onPress={hasImage ? undefined : onUpload}
        disabled={disabled || hasImage}
        accessibilityRole="button"
        accessibilityLabel={hasImage ? `${label} uploaded` : `Upload ${label}`}>
        {hasImage ? (
          <View style={gvStyles.uploadCardFilled}>
            <View style={gvStyles.uploadPreview}>
              <Image
                source={{ uri: imageUri as string }}
                style={gvStyles.uploadPreviewImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View style={gvStyles.uploadActions}>
              <Pressable
                onPress={onDelete}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${label}`}>
                <Text style={gvStyles.deleteAction}>Delete</Text>
              </Pressable>
              <Pressable
                onPress={onRetake}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Retake ${label}`}>
                <Text style={gvStyles.retakeAction}>Retake</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={gvStyles.uploadCardEmpty}>
            <Icon name="tray-arrow-up" size={34} color={GV_COLORS.dashed} />
            <Text style={gvStyles.uploadCardLabel}>{label}</Text>
            <Text style={gvStyles.uploadCardHint}>Click here to upload or open camera</Text>
          </View>
        )}
      </Pressable>
    );
  },
);

EmiratesIdUploadCard.displayName = 'EmiratesIdUploadCard';
