import React, { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getIdentityVerificationCardCopy,
  IdentityVerificationCardStatus,
  isIdentityVerificationCardClickable,
} from '../utils/identityVerificationUtils';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props {
  status: IdentityVerificationCardStatus;
  rejectionReason?: string | null;
  onPress: () => void;
}

const cardStyleForStatus = (status: IdentityVerificationCardStatus) => {
  switch (status) {
    case 'pending':
      return {
        borderColor: '#FCD34D',
        backgroundColor: '#FFFBEB',
        textColor: '#B45309',
        icon: 'clock-outline',
      };
    case 'rejected':
      return {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
        textColor: PE_COLORS.error,
        icon: 'alert-circle-outline',
      };
    case 'none':
    default:
      return {
        borderColor: PE_COLORS.dashed,
        backgroundColor: '#FFFFFF',
        textColor: PE_COLORS.primary,
        icon: 'check-decagram',
      };
  }
};

export const GetVerifiedCard = memo<Props>(({ status, rejectionReason, onPress }) => {
  const copy = useMemo(() => getIdentityVerificationCardCopy(status), [status]);
  const visual = useMemo(() => cardStyleForStatus(status), [status]);
  const isClickable = isIdentityVerificationCardClickable(status);

  if (status === 'approved') {
    return null;
  }

  const content = (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[peStyles.verifiedText, { color: visual.textColor }]}>{copy.title}</Text>
        <Icon name={visual.icon} size={20} color={visual.textColor} />
      </View>
      {copy.subtitle ? (
        <Text style={[peStyles.verifiedStatusLabel, { color: visual.textColor }]}>{copy.subtitle}</Text>
      ) : null}
      {copy.message ? <Text style={peStyles.verifiedSubtitle}>{copy.message}</Text> : null}
      {status === 'rejected' && rejectionReason ? (
        <Text style={peStyles.verifiedRejectionReason} numberOfLines={3}>
          {rejectionReason}
        </Text>
      ) : null}
    </View>
  );

  const cardStyle = [
    peStyles.verifiedCard,
    {
      borderColor: visual.borderColor,
      backgroundColor: visual.backgroundColor,
    },
  ];

  if (!isClickable) {
    return (
      <View
        style={cardStyle}
        accessibilityRole="text"
        accessibilityLabel={`${copy.title}. ${copy.message ?? ''}`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={cardStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.title}>
      {content}
    </Pressable>
  );
});

GetVerifiedCard.displayName = 'GetVerifiedCard';
