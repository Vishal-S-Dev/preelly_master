import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ProfileProductGridItem } from '../../../types/profile.types';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  item: ProfileProductGridItem;
  index: number;
  onPress?: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ProductGridCard = memo<Props>(({ item, onPress }) => {
  const { colors } = useProfileStyles();
  const { width } = useWindowDimensions();
  const cellWidth = useMemo(
    () => (width - colors.gridGap * 2) / 3,
    [width, colors.gridGap],
  );
  const cellHeight = useMemo(() => cellWidth * 1.38, [cellWidth]);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const priceLabel = `${item.currency} ${item.price.toLocaleString()}`;

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item.id)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      style={[cardStyles.cell, { width: cellWidth, height: cellHeight }, animStyle]}>
      <Image source={{ uri: '' + item.imageUrl }} style={cardStyles.image} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.65)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={cardStyles.topTextWrap}>
        <Text style={cardStyles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      <View style={cardStyles.bottomTextWrap}>
        <Text style={cardStyles.price}>{priceLabel}</Text>
      </View>
    </AnimatedPressable>
  );
});

ProductGridCard.displayName = 'ProductGridCard';

const cardStyles = StyleSheet.create({
  cell: {
    overflow: 'hidden',
    backgroundColor: '#374151',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topTextWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  bottomTextWrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    left: 8,
    alignItems: 'flex-end',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
