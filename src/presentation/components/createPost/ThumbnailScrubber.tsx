import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';
import { VideoFrameThumb } from '../../../types/videoFrame.types';
import { indexAtTime, timeAtScrollIndex } from '../../../utils/videoFrameThumbnails';

export const SCRUBBER_THUMB_WIDTH = 62;
export const SCRUBBER_THUMB_HEIGHT = 44;
export const SCRUBBER_THUMB_GAP = 5;
export const SCRUBBER_ITEM_WIDTH = SCRUBBER_THUMB_WIDTH + SCRUBBER_THUMB_GAP;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PADDING = (SCREEN_WIDTH - SCRUBBER_THUMB_WIDTH) / 2;
const SELECTOR_HEIGHT = SCRUBBER_THUMB_HEIGHT + 14;
const SELECTOR_WIDTH = SCRUBBER_THUMB_WIDTH + 10;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<VideoFrameThumb>);

interface SegmentProps {
  uri: string | null;
  isActive: boolean;
}

const FilmstripSegment = memo<SegmentProps>(
  ({ uri, isActive }) => (
    <View style={[styles.segment, { opacity: isActive ? 1 : 0.38 }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.segmentImage} resizeMode="cover" />
      ) : (
        <View style={styles.segmentFallback} />
      )}
    </View>
  ),
  (prev, next) => prev.uri === next.uri && prev.isActive === next.isActive,
);

FilmstripSegment.displayName = 'FilmstripSegment';

interface Props {
  frames: VideoFrameThumb[];
  currentTimeSec: number;
  onScrub: (timeSec: number) => void;
  onScrubEnd?: (timeSec: number) => void;
  disabled?: boolean;
}

export const ThumbnailScrubber = memo<Props>(
  ({
    frames,
    currentTimeSec,
    onScrub,
    onScrubEnd,
    disabled,
  }) => {
    const listRef = useRef<FlatList<VideoFrameThumb>>(null);
    const isUserScrolling = useRef(false);
    const framesRef = useRef(frames);
    const [activeIndex, setActiveIndex] = React.useState(0);

    framesRef.current = frames;

    const updateActiveIndex = useCallback((index: number) => {
      setActiveIndex(index);
    }, []);

    const scrubFromIndex = useCallback(
      (index: number) => {
        updateActiveIndex(index);
        onScrub(timeAtScrollIndex(framesRef.current, index));
      },
      [onScrub, updateActiveIndex],
    );

    const scrubEndFromIndex = useCallback(
      (index: number) => {
        const time = timeAtScrollIndex(framesRef.current, index);
        onScrub(time);
        onScrubEnd?.(time);
      },
      [onScrub, onScrubEnd],
    );

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: event => {
        const index = Math.round(event.contentOffset.x / SCRUBBER_ITEM_WIDTH);
        runOnJS(scrubFromIndex)(index);
      },
      onEndDrag: event => {
        const index = Math.round(event.contentOffset.x / SCRUBBER_ITEM_WIDTH);
        runOnJS(scrubEndFromIndex)(index);
      },
      onMomentumEnd: event => {
        const index = Math.round(event.contentOffset.x / SCRUBBER_ITEM_WIDTH);
        runOnJS(scrubEndFromIndex)(index);
      },
    });

    useEffect(() => {
      if (!frames.length) return;
      const index = indexAtTime(frames, currentTimeSec);
      if (isUserScrolling.current) {
        updateActiveIndex(index);
        return;
      }
      updateActiveIndex(index);
      listRef.current?.scrollToOffset({
        offset: index * SCRUBBER_ITEM_WIDTH,
        animated: false,
      });
    }, [currentTimeSec, frames, updateActiveIndex]);

    const onScrollBeginDrag = useCallback(() => {
      isUserScrolling.current = true;
    }, []);

    const onScrollEnd = useCallback(() => {
      requestAnimationFrame(() => {
        isUserScrolling.current = false;
      });
    }, []);

    const renderItem = useCallback(
      ({ item, index }: { item: VideoFrameThumb; index: number }) => (
        <FilmstripSegment uri={item.uri} isActive={index === activeIndex} />
      ),
      [activeIndex],
    );

    const keyExtractor = useCallback((item: VideoFrameThumb) => `thumb_${item.index}`, []);

    const getItemLayout = useCallback(
      (_: ArrayLike<VideoFrameThumb> | null | undefined, index: number) => ({
        length: SCRUBBER_ITEM_WIDTH,
        offset: SCRUBBER_ITEM_WIDTH * index,
        index,
      }),
      [],
    );

    if (!frames.length) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.centerIndicator} pointerEvents="none">
          <View style={styles.centerBracket} />
        </View>

        <AnimatedFlatList
          ref={listRef as React.RefObject<FlatList<VideoFrameThumb>>}
          data={frames}
          horizontal
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCRUBBER_ITEM_WIDTH}
          decelerationRate="fast"
          scrollEnabled={!disabled}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          onScroll={scrollHandler}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          removeClippedSubviews
        />
      </View>
    );
  },
);

ThumbnailScrubber.displayName = 'ThumbnailScrubber';

const styles = StyleSheet.create({
  container: {
    height: SELECTOR_HEIGHT + 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: SIDE_PADDING,
    alignItems: 'center',
  },
  centerIndicator: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  centerBracket: {
    width: SELECTOR_WIDTH,
    height: SELECTOR_HEIGHT,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  segment: {
    width: SCRUBBER_THUMB_WIDTH,
    height: SCRUBBER_THUMB_HEIGHT,
    marginRight: SCRUBBER_THUMB_GAP,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#D1D1D6',
  },
  segmentImage: {
    width: '100%',
    height: '100%',
  },
  segmentFallback: {
    flex: 1,
    backgroundColor: '#C7C7CC',
  },
});
