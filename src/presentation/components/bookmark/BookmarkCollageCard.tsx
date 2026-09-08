import React, { memo, useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BookmarkGroup, BookmarkGroupSummary, BookmarkListingItem } from '../../../types/bookmark.types';
import { formatPinCountLabel, formatRelativeTimeShort } from '../../../utils/relativeTime';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  summary: BookmarkGroupSummary;
  cardWidth: number;
  onPress: (group: BookmarkGroup) => void;
  onLongPress?: (group: BookmarkGroup) => void;
  /** Gates the single autoplaying video preview (the primary tile only — see `Tile` below) so
   * only boards currently on screen ever hold a decoder open. */
  isVisible?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const GAP = 3;

const Tile: React.FC<{
  item: BookmarkListingItem;
  style: object;
  radius: { tl?: number; tr?: number; bl?: number; br?: number };
  allowVideo: boolean;
}> = ({ item, style, radius, allowVideo }) => {
  const theme = useAppTheme();
  const [videoError, setVideoError] = useState(false);
  const showVideo = allowVideo && item.hasVideo && Boolean(item.videoUrl) && !videoError;

  const radiusStyle = {
    borderTopLeftRadius: radius.tl ?? 0,
    borderTopRightRadius: radius.tr ?? 0,
    borderBottomLeftRadius: radius.bl ?? 0,
    borderBottomRightRadius: radius.br ?? 0,
  };

  return (
    <View style={[style, styles.tile, radiusStyle, { backgroundColor: theme.card }]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.fill} resizeMode="cover" />
      ) : (
        <View style={[styles.fill, { backgroundColor: theme.subText + '22' }]}>
          <Icon name="image-off-outline" size={20} color={theme.subText} />
        </View>
      )}

      {/* Mounted only for the primary tile while the board card is on screen — unmounting on
          scroll-out releases the decoder, matching the same lifecycle SearchResultCard uses for
          its video previews. Falls back to the poster image above on playback error. */}
      {showVideo ? (
        <Video
          source={{ uri: item.videoUrl }}
          style={styles.fill}
          resizeMode="cover"
          muted
          repeat
          paused={false}
          playInBackground={false}
          playWhenInactive={false}
          poster={item.imageUrl || undefined}
          posterResizeMode="cover"
          onError={() => setVideoError(true)}
        />
      ) : null}
    </View>
  );
};

const EmptyTile: React.FC<{ style: object }> = ({ style }) => {
  const theme = useAppTheme();
  return (
    <View style={[style, styles.tile, styles.emptyTile, { backgroundColor: theme.card }]}>
      <Icon name="image-multiple-outline" size={22} color={theme.subText} />
    </View>
  );
};

const Collage: React.FC<{ items: BookmarkListingItem[]; height: number; isVisible: boolean }> = ({
  items,
  height,
  isVisible,
}) => {
  const theme = useAppTheme();
  const radius = 16;

  if (items.length === 0) {
    return (
      <View style={[styles.collage, { height, backgroundColor: theme.card, borderRadius: radius }]}>
        <Icon name="image-multiple-outline" size={28} color={theme.subText} />
        <Text style={[styles.emptyLabel, { color: theme.subText }]}>No items yet</Text>
      </View>
    );
  }

  if (items.length === 1) {
    return (
      <View style={[styles.collage, { height }]}>
        <Tile
          item={items[0]}
          style={styles.full}
          radius={{ tl: radius, tr: radius, bl: radius, br: radius }}
          allowVideo={isVisible}
        />
      </View>
    );
  }

  if (items.length === 2) {
    return (
      <View style={[styles.collage, styles.row, { height }]}>
        <Tile item={items[0]} style={styles.halfWidth} radius={{ tl: radius, bl: radius }} allowVideo={isVisible} />
        <View style={{ width: GAP }} />
        <Tile item={items[1]} style={styles.halfWidth} radius={{ tr: radius, br: radius }} allowVideo={false} />
      </View>
    );
  }

  if (items.length === 3) {
    return (
      <View style={[styles.collage, styles.row, { height }]}>
        <Tile item={items[0]} style={styles.halfWidth} radius={{ tl: radius, bl: radius }} allowVideo={isVisible} />
        <View style={{ width: GAP }} />
        <View style={styles.halfWidth}>
          <Tile item={items[1]} style={styles.halfHeight} radius={{ tr: radius }} allowVideo={false} />
          <View style={{ height: GAP }} />
          <Tile item={items[2]} style={styles.halfHeight} radius={{ br: radius }} allowVideo={false} />
        </View>
      </View>
    );
  }

  // 4+ — only the 4 preview items handed to us are ever rendered (capped upstream).
  const [a, b, c, d] = items;
  return (
    <View style={[styles.collage, { height }]}>
      <View style={styles.row}>
        <Tile item={a} style={styles.quadrant} radius={{ tl: radius }} allowVideo={isVisible} />
        <View style={{ width: GAP }} />
        <Tile item={b} style={styles.quadrant} radius={{ tr: radius }} allowVideo={false} />
      </View>
      <View style={{ height: GAP }} />
      <View style={styles.row}>
        <Tile item={c} style={styles.quadrant} radius={{ bl: radius }} allowVideo={false} />
        <View style={{ width: GAP }} />
        {d ? (
          <Tile item={d} style={styles.quadrant} radius={{ br: radius }} allowVideo={false} />
        ) : (
          <EmptyTile style={styles.quadrant} />
        )}
      </View>
    </View>
  );
};

export const BookmarkCollageCard = memo<Props>(
  ({ summary, cardWidth, onPress, onLongPress, isVisible = false }) => {
    const theme = useAppTheme();
    const scale = useSharedValue(1);
    const collageHeight = cardWidth * 0.92;
    const { group, itemCount, previewItems, lastActivityAt } = summary;

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handlePress = useCallback(() => onPress(group), [group, onPress]);
    const handleLongPress = useCallback(() => onLongPress?.(group), [group, onLongPress]);

    const metaLabel = [
      formatPinCountLabel(itemCount),
      itemCount > 0 ? formatRelativeTimeShort(lastActivityAt) : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <AnimatedPressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 16 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${group.name} group`}
        accessibilityHint={`${metaLabel || 'Empty board'}`}
        hitSlop={4}
        style={[{ width: cardWidth }, animStyle]}
      >
        <Collage items={previewItems} height={collageHeight} isVisible={isVisible} />
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.meta, { color: theme.subText }]} numberOfLines={1}>
          {metaLabel || 'No items yet'}
        </Text>
      </AnimatedPressable>
    );
  },
);

BookmarkCollageCard.displayName = 'BookmarkCollageCard';

const styles = StyleSheet.create({
  collage: {
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  full: {
    width: '100%',
    height: '100%',
  },
  halfWidth: {
    flex: 1,
    height: '100%',
  },
  halfHeight: {
    flex: 1,
    width: '100%',
  },
  quadrant: {
    flex: 1,
  },
  tile: {
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
});
