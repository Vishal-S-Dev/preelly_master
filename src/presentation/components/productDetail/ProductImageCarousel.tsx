import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { filterRenderableImageUris } from '../../../utils/createPostImageUtils';

interface Props {
  images: string[];
  onCounterPress?: () => void;
}

export const ProductImageCarousel = memo<Props>(({ images, onCounterPress }) => {
  const { width } = useWindowDimensions();
  const carouselHeight = hp('100%');
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const gallery = useMemo(() => filterRenderableImageUris(images), [images]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index) {
        setIndex(next);
      }
    },
    [index, width],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <Image
        source={{ uri: item }}
        style={{
          width,
          height: carouselHeight,
          backgroundColor: '#000',
        }}
        resizeMode="cover"
      />
    ),
    [carouselHeight, width],
  );

  if (!gallery.length) {
    return (
      <View style={[styles.empty, { height: carouselHeight }]}>
        <Icon name="image-off-outline" size={40} color="#9CA3AF" />
      </View>
    );
  }

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
        pointerEvents="none"
      />
      <Pressable
        style={styles.counter}
        onPress={onCounterPress}
        disabled={!onCounterPress}
        accessibilityRole="button"
        accessibilityLabel={`View all photos, ${index + 1} of ${gallery.length}`}
      >
        <Icon name="image-outline" size={14} color="#fff" />
        <Text style={styles.counterText}>
          {index + 1}/{gallery.length}
        </Text>
      </Pressable>
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
    zIndex: 30,
  },
  counterText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
