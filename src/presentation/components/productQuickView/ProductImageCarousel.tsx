import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { FlatList, NativeViewGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { qvStyles } from './productQuickViewStyles';

interface Props {
  images: string[];
}

export const ProductImageCarousel: React.FC<Props> = ({ images }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowWidth);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const gallery = images.length > 0 ? images : [];

  const slideWidth = containerWidth > 0 ? containerWidth : windowWidth;
  const imageHeight = qvStyles.carouselImage.height;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== containerWidth) {
      setContainerWidth(measured);
    }
  }, [containerWidth]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      setActiveIndex(Math.min(Math.max(index, 0), gallery.length - 1));
    },
    [gallery.length, slideWidth],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: slideWidth,
      offset: slideWidth * index,
      index,
    }),
    [slideWidth],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <Image
        source={{ uri: item }}
        style={{ width: slideWidth, height: imageHeight , backgroundColor: '#000' }}
        resizeMode="cover"
      />
    ),
    [imageHeight, slideWidth],
  );


  if (!gallery.length) {
    return null;
  }

  return (
    <View style={qvStyles.carouselOuter}>
      <View style={qvStyles.carouselWrap} onLayout={onLayout}>
        <NativeViewGestureHandler disallowInterruption>
          <FlatList
          ref={listRef}
          data={gallery}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={slideWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          nestedScrollEnabled={Platform.OS === 'android'}
          directionalLockEnabled
          getItemLayout={getItemLayout}
          overScrollMode="never"
          renderItem={renderItem}
          />
        </NativeViewGestureHandler>
        <View style={qvStyles.imageBadge} pointerEvents="none">
          <Icon name="image-outline" size={14} color="#FFFFFF" />
          <Text style={qvStyles.imageBadgeText}>
            {activeIndex + 1}/{gallery.length}
          </Text>
        </View>
      </View>
    </View>
  );
};
