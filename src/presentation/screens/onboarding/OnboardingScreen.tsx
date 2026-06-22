import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import { storage } from '../../../utils/storage';
import { AppButton } from '../../components/common/AppButton';
import { useAppDispatch } from '../../hooks/useRedux';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { setOnboardingCompleted } from '../../redux/slices/appSlice';
import { OnboardingPagination } from './OnboardingPagination';
import { OnboardingSlide } from './OnboardingSlide';
import { ONBOARDING_SLIDES } from './onboardingSlides';
import { OnboardingSlideModel } from './onboarding.types';
import { onboardingScreenStyles } from './onboardingScreenStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<OnboardingSlideModel>);

export const OnboardingScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const insets = useStableSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlideModel>>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => ONBOARDING_SLIDES, []);
  const isLastSlide = activeIndex === slides.length - 1;

  const completeOnboarding = useCallback(async () => {
    await storage.setString(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    dispatch(setOnboardingCompleted(true));
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    void completeOnboarding();
  }, [completeOnboarding]);

  const handlePrimaryAction = useCallback(() => {
    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    const nextIndex = activeIndex + 1;
    listRef.current?.scrollToOffset({
      offset: nextIndex * SCREEN_WIDTH,
      animated: true,
    });
    setActiveIndex(nextIndex);
  }, [activeIndex, completeOnboarding, isLastSlide]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(page);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem: ListRenderItem<OnboardingSlideModel> = useCallback(
    ({ item, index }) => <OnboardingSlide item={item} index={index} scrollX={scrollX} />,
    [scrollX],
  );

  const keyExtractor = useCallback((item: OnboardingSlideModel) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<OnboardingSlideModel> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <View style={onboardingScreenStyles.root}>
      <Pressable
        onPress={handleSkip}
        style={[onboardingScreenStyles.skipBtn, { top: insets.top + 8 }]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding">
        <Text style={onboardingScreenStyles.skipText}>Skip</Text>
      </Pressable>

      <AnimatedFlatList
        ref={listRef as React.RefObject<FlatList<OnboardingSlideModel>>}
        data={slides}
        style={styles.list}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        decelerationRate="fast"
        accessibilityRole="list"
        accessibilityLabel="Onboarding slides"
      />

      <View
        style={[
          onboardingScreenStyles.footer,
          styles.footerOverlay,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>
        <OnboardingPagination count={slides.length} scrollX={scrollX} pageWidth={SCREEN_WIDTH} />

        <View style={onboardingScreenStyles.ctaWrap}>
          <AppButton
            title={isLastSlide ? 'Get Started' : 'Next'}
            onPress={handlePrimaryAction}
            style={styles.ctaButton}
            accessibilityLabel={isLastSlide ? 'Get started with Preelly' : 'Go to next onboarding slide'}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  footerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaButton: {
    marginVertical: 0,
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#0000FF',
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
