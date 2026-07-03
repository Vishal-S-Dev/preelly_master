import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { AppText } from '../../components/common/AppText';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductImageViewer'>;

export const ProductImageViewerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { images, initialIndex = 0 } = route.params;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(initialIndex);

  const safeInitialIndex = useMemo(
    () => Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
    [images.length, initialIndex],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index) {
        setIndex(next);
      }
    },
    [index, width],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={{ width, height }}>
        <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
      </View>
    ),
    [height, width],
  );

  if (!images.length) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        initialScrollIndex={safeInitialIndex}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, i) => `${item}_${i}`}
        renderItem={renderItem}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollToIndexFailed={({ index: failedIndex }) => {
          listRef.current?.scrollToOffset({ offset: width * failedIndex, animated: false });
        }}
      />

      <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.counter}>
          <Icon name="image-outline" size={14} color="#FFFFFF" />
          <AppText weight="700" style={styles.counterText}>
            {index + 1}/{images.length}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
