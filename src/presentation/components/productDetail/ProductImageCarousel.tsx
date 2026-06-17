import React, { memo, useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { PD_COLORS, pdStyles } from './productDetailStyles';

interface Props {
  images: string[];
}

export const ProductImageCarousel = memo<Props>(({ images }) => {
  const { width } = useWindowDimensions();
  const carouselHeight = hp('44%');
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index) {
        setIndex(next);
      }
    },
    [index, width],
  );

 /* const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <Image source={{ uri: item }} style={{ width , height: carouselHeight }} resizeMode="cover" />
    ),
    [carouselHeight, width],
  );*/


  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <Image
        source={{ uri: item }}
        style={{
          width: width, // screen width
          height: carouselHeight,
          backgroundColor: '#000',
        }}
        resizeMode="contain"
      />
    ),
    [carouselHeight, width],
  );
  const gallery = images.length ? images : ['https://picsum.photos/seed/fallback-detail/1080/720'];

  return (
    <View>
      <FlatList
        ref={listRef}
        data={gallery}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, i) => `${item}_${i}`}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: hp('12%') }]}
      />
      <View style={styles.counter}>
        <Icon name="image-outline" size={14} color="#fff" />
        <Text style={styles.counterText}>
          {index + 1}/{gallery.length}
        </Text>
      </View>
    </View>
  );
});

ProductImageCarousel.displayName = 'ProductImageCarousel';

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: 16,
    top: hp('6%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  counterText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
