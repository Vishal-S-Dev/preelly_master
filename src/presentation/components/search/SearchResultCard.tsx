import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SearchListingItem } from '../../../types/search.types';
import { useAppTheme } from '../../hooks/useAppTheme';

const GRID_HORIZONTAL_PADDING = 16;
const GRID_GAP = 10;

interface Props {
  item: SearchListingItem;
  onPress?: (item: SearchListingItem) => void;
  onFavorite?: (item: SearchListingItem) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SearchResultCard = memo<Props>(({ item, onPress, onFavorite }) => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scale = useSharedValue(1);

  const cardWidth = useMemo(
    () => (width - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2,
    [width],
  );
  const cardHeight = useMemo(() => cardWidth * 1.38, [cardWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const priceLabel = `${item.currency} ${item.price.toLocaleString()}`;

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${priceLabel}`}
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          shadowColor: '#000',
        },
        animStyle,
      ]}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: theme.subText + '33' }]} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.15)', 'transparent']}
        locations={[0, 0.55, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.35, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {item.isFeatured ? (
        <View style={styles.featuredBadge} pointerEvents="none">
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      ) : null}

      {item.hasVideo ? (
        <View style={styles.playBadge} pointerEvents="none">
          <Icon name="play" size={14} color="#FFFFFF" />
        </View>
      ) : null}

      {onFavorite ? (
        <Pressable
          style={styles.favoriteBtn}
          onPress={() => onFavorite(item)}
          accessibilityRole="button"
          accessibilityLabel={item.isSaved ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={8}
        >
          <Icon
            name={item.isSaved ? 'heart' : 'heart-outline'}
            size={16}
            color={item.isSaved ? theme.danger : '#FFFFFF'}
          />
        </Pressable>
      ) : null}

      <View style={styles.topContent} pointerEvents="none">
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
      </View>

      <View style={styles.bottomContent} pointerEvents="none">
        {item.location ? (
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        ) : null}
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
    </AnimatedPressable>
  );
});

SearchResultCard.displayName = 'SearchResultCard';

export const SEARCH_RESULT_GRID_GAP = GRID_GAP;
export const SEARCH_RESULT_GRID_PADDING = GRID_HORIZONTAL_PADDING;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: GRID_GAP,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  topContent: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  bottomContent: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    alignItems: 'flex-end',
  },
  location: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 3,
    textAlign: 'right',
    maxWidth: '100%',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,255,0.88)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  playBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
