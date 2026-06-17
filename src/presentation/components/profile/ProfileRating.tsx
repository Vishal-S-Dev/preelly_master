import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProfileRating as ProfileRatingType } from '../../../types/profile.types';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  rating: ProfileRatingType;
}

export const ProfileRating = memo<Props>(({ rating }) => {
  const { styles, colors } = useProfileStyles();

  return (
    <View style={styles.ratingPill}>
      <Icon name="star" size={16} color={colors.star} />
      <Text style={styles.ratingValue}>{rating.value.toFixed(1)}</Text>
      <View style={styles.ratingDivider} />
      <Text style={styles.ratingCount}>{rating.totalRatings} rating</Text>
    </View>
  );
});

ProfileRating.displayName = 'ProfileRating';
