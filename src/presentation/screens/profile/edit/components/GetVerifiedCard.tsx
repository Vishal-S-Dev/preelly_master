import React, { memo } from 'react';
import { Pressable, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { peStyles } from '../profileEditStyles';

interface Props {
  onPress: () => void;
  hidden?: boolean;
}

export const GetVerifiedCard = memo<Props>(({ onPress, hidden }) => {
  if (hidden) {
    return null;
  }
  return (
    <Pressable
      style={peStyles.verifiedCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Get verified">
      <Text style={peStyles.verifiedText}>Get Verified</Text>
      <Icon name="check-decagram" size={20} color="#2563EB" />
    </Pressable>
  );
});

GetVerifiedCard.displayName = 'GetVerifiedCard';
