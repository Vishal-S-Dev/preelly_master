import React, { memo, useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SearchListingItem } from '../../../types/search.types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { SEARCH_CARD_HEIGHT, SEARCH_CARD_WIDTH } from './searchStyles';

interface Props {
  title: string;
  data: SearchListingItem[];
  type?: string;
  loading?: boolean;
  error?: boolean;
  onPress?: (item: SearchListingItem) => void;
  onFavorite?: (item: SearchListingItem) => void;
  showVideoIndicator?: boolean;
  showPrice?: boolean;
  showLocation?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ListingCard = memo<{
  item: SearchListingItem;
  showVideoIndicator: boolean;
  showPrice: boolean;
  showLocation: boolean;
  onPress?: (item: SearchListingItem) => void;
  onFavorite?: (item: SearchListingItem) => void;
}>(({ item, showVideoIndicator, showPrice, showLocation, onPress, onFavorite }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
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
      style={[styles.card, animStyle]}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: theme.subText + '33' }]} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.18)', 'transparent']}
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

      <View style={styles.topContent} pointerEvents="none">
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
      </View>

      <View style={styles.bottomContent} pointerEvents="none">
        {showLocation && item.location ? (
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        ) : null}
        {showPrice ? <Text style={styles.price}>{priceLabel}</Text> : null}
      </View>

      {showVideoIndicator && item.hasVideo ? (
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
    </AnimatedPressable>
  );
});

ListingCard.displayName = 'ListingCard';

export const HorizontalVideoListing = memo<Props>(
  ({
    title,
    data,
    loading,
    error,
    onPress,
    onFavorite,
    showVideoIndicator = true,
    showPrice = true,
    showLocation = true,
  }) => {
    const theme = useAppTheme();

    const renderItem = useCallback(
      ({ item }: { item: SearchListingItem }) => (
        <ListingCard
          item={item}
          showVideoIndicator={showVideoIndicator}
          showPrice={showPrice}
          showLocation={showLocation}
          onPress={onPress}
          onFavorite={onFavorite}
        />
      ),
      [onFavorite, onPress, showLocation, showPrice, showVideoIndicator],
    );

    const keyExtractor = useCallback((item: SearchListingItem) => item.id, []);

    return (
      <View style={styles.section}>
        <Text style={[styles.titleText, { color: theme.text }]}>{title}</Text>
        {error ? (
          <Text style={[styles.stateText, { color: theme.subText }]}>
            Unable to load listings right now.
          </Text>
        ) : !loading && data.length === 0 ? (
          <Text style={[styles.stateText, { color: theme.subText }]}>No listings found.</Text>
        ) : (
          <FlatList
            data={data}
            horizontal
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            windowSize={5}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            removeClippedSubviews
          />
        )}
      </View>
    );
  },
);

HorizontalVideoListing.displayName = 'HorizontalVideoListing';

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  stateText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: SEARCH_CARD_WIDTH,
    height: SEARCH_CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SEARCH_CARD_HEIGHT * 0.42,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SEARCH_CARD_HEIGHT * 0.38,
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
    fontWeight: '600',
    lineHeight: 17,
  },
  bottomContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    alignItems: 'flex-end',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  location: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
    maxWidth: '100%',
  },
  playBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -15,
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
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
