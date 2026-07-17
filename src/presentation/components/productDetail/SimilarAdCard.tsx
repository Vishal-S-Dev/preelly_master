import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SimilarAdItem } from '../../../types/product.types';

interface Props {
  item: SimilarAdItem;
  onPress?: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const resolveAvailabilityStyle = (availability: string) => {
  const normalized = availability.trim().toLowerCase();
  if (normalized === 'sold') {
    return { backgroundColor: '#6B7280', label: 'Sold' };
  }
  if (normalized === 'unavailable' || normalized === 'inactive') {
    return { backgroundColor: '#F59E0B', label: availability };
  }
  return { backgroundColor: '#22C55E', label: availability || 'Available' };
};

export const SimilarAdCard = memo<Props>(({ item, onPress }) => {
  const { width } = useWindowDimensions();
  const scale = useSharedValue(1);

  const cardWidth = useMemo(() => width * 0.48, [width]);
  const cardHeight = useMemo(() => cardWidth * 1.60, [cardWidth]);
  const priceLabel = `${item.currency} ${item.price.toLocaleString()}`;
  const availabilityStyle = useMemo(
    () => resolveAvailabilityStyle(item.availability ?? 'Available'),
    [item.availability],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item.id)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${priceLabel}`}
      style={[styles.card, { width: cardWidth, height: cardHeight }, animStyle]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          resizeMethod="resize"
          fadeDuration={0}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.28)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.38, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <View style={styles.topContent} pointerEvents="none">
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
      </View>

      <View style={styles.footer} pointerEvents="none">
        <View style={[styles.badge, { backgroundColor: availabilityStyle.backgroundColor }]}>
          <Text style={styles.badgeText}>{availabilityStyle.label}</Text>
        </View>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
    </AnimatedPressable>
  );
});

SimilarAdCard.displayName = 'SimilarAdCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#374151',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  topContent: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '48%',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
});
