import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler } from 'react-native-reanimated';
import { VideoFrameScrubberProps, VideoFrameThumb } from '../../../types/videoFrame.types';
import { formatVideoTimePrecise } from '../../../utils/videoTime';
import { indexAtTime, timeAtScrollIndex } from '../../../utils/videoFrameThumbnails';

export const SCRUBBER_THUMB_WIDTH = 56;
export const SCRUBBER_THUMB_GAP = 4;
export const SCRUBBER_ITEM_WIDTH = SCRUBBER_THUMB_WIDTH + SCRUBBER_THUMB_GAP;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PADDING = (SCREEN_WIDTH - SCRUBBER_THUMB_WIDTH) / 2;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<VideoFrameThumb>);

interface SegmentProps {
  index: number;
  uri: string | null;
}

const FilmstripSegment = memo<SegmentProps>(
  ({ index, uri }) => (
    <View style={styles.segment}>
      {uri ? (
        <Image source={{ uri }} style={styles.segmentImage} resizeMode="cover" />
      ) : (
        <View style={[styles.segmentFallback, index % 2 === 0 && styles.segmentAlt]} />
      )}
    </View>
  ),
  (prev, next) => prev.uri === next.uri && prev.index === next.index,
);

FilmstripSegment.displayName = 'FilmstripSegment';

const FilmstripRow = memo<{ item: VideoFrameThumb }>(
  ({ item }) => <FilmstripSegment index={item.index} uri={item.uri} />,
  (prev, next) => prev.item.index === next.item.index && prev.item.uri === next.item.uri,
);

FilmstripRow.displayName = 'FilmstripRow';

export const FrameScrubber = memo<VideoFrameScrubberProps>(
  ({
    frames,
    durationSec,
    currentTimeSec,
    onScrub,
    onScrubEnd,
    disabled,
    isScrubbing,
    followTimeline = false,
    formatTime = formatVideoTimePrecise,
  }) => {
    const listRef = useRef<FlatList<VideoFrameThumb>>(null);
    const isUserScrolling = useRef(false);
    const framesRef = useRef(frames);
    framesRef.current = frames;

    const scrubFromIndex = useCallback(
      (index: number) => onScrub(timeAtScrollIndex(framesRef.current, index)),
      [onScrub],
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
      if (!followTimeline || isUserScrolling.current || !frames.length) return;
      const index = indexAtTime(frames, currentTimeSec);
      listRef.current?.scrollToOffset({
        offset: index * SCRUBBER_ITEM_WIDTH,
        animated: false,
      });
    }, [currentTimeSec, followTimeline, frames.length]);

    const onScrollBeginDrag = useCallback(() => {
      isUserScrolling.current = true;
    }, []);

    const onScrollEnd = useCallback(() => {
      requestAnimationFrame(() => {
        isUserScrolling.current = false;
      });
    }, []);

    const renderItem = useCallback(
      ({ item }: { item: VideoFrameThumb }) => <FilmstripRow item={item} />,
      [],
    );

    const keyExtractor = useCallback((item: VideoFrameThumb) => `seg_${item.index}`, []);

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
        {isScrubbing ? (
          <View style={styles.previewBubble} pointerEvents="none">
            <Text style={styles.previewTime}>{formatTime(currentTimeSec)}</Text>
          </View>
        ) : null}

        <View style={styles.playhead} pointerEvents="none">
          <View style={styles.playheadKnob} />
          <View style={styles.playheadLine} />
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
          scrollEventThrottle={32}
          contentContainerStyle={styles.listContent}
          onScroll={scrollHandler}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          removeClippedSubviews
        />
        <Text style={styles.hint}>
          Drag filmstrip to scrub · {formatDuration(durationSec)} total
        </Text>
      </View>
    );
  },
);

FrameScrubber.displayName = 'FrameScrubber';

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    height: 132,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: SIDE_PADDING,
  },
  previewBubble: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 5,
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  playhead: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 72,
    bottom: 0,
    alignItems: 'center',
    zIndex: 3,
    pointerEvents: 'none',
  },
  playheadKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  playheadLine: {
    width: 3,
    flex: 1,
    maxHeight: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 2,
  },
  segment: {
    width: SCRUBBER_THUMB_WIDTH,
    height: 64,
    marginRight: SCRUBBER_THUMB_GAP,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  segmentAlt: {
    backgroundColor: '#3A3A3C',
  },
  segmentImage: {
    width: '100%',
    height: '100%',
  },
  segmentFallback: {
    flex: 1,
    backgroundColor: '#2C2C2E',
  },
  hint: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 6,
  },
});
