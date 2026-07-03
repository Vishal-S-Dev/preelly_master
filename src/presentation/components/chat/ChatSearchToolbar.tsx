import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppTheme } from '../../theme/colors';
import { ChatFilter } from '../../screens/chat/chatTypes';
import { ChatScreenStyles } from '../../screens/chat/chatScreenStyles';

const FILTERS: ChatFilter[] = ['All', 'Buying', 'Selling', 'Unread', 'Following'];
const SEARCH_BAR_HEIGHT = 46;
const SEARCH_SLOT_GAP = 10;

type Props = {
  activeFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  styles: ChatScreenStyles;
  theme: AppTheme;
};

export const ChatSearchToolbar = memo<Props>(
  ({
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchQueryChange,
    styles,
    theme,
  }) => {
    const inputRef = useRef<TextInput>(null);
    const progress = useSharedValue(0);
    const [searchActive, setSearchActive] = useState(false);

    const openSearch = useCallback(() => {
      setSearchActive(true);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      setTimeout(() => inputRef.current?.focus(), 280);
    }, [progress]);

    const closeSearch = useCallback(() => {
      inputRef.current?.blur();
      progress.value = withTiming(
        0,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) {
            runOnJS(setSearchActive)(false);
            runOnJS(onSearchQueryChange)('');
          }
        },
      );
    }, [onSearchQueryChange, progress]);

    const searchSlotStyle = useAnimatedStyle(() => ({
      height: interpolate(
        progress.value,
        [0, 1],
        [0, SEARCH_BAR_HEIGHT + SEARCH_SLOT_GAP],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.6, 1], Extrapolation.CLAMP),
      marginBottom: interpolate(progress.value, [0, 1], [0, SEARCH_SLOT_GAP], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [168, 0], Extrapolation.CLAMP),
        },
        {
          scaleX: interpolate(progress.value, [0, 1], [0.08, 1], Extrapolation.CLAMP),
        },
      ],
    }));

    const searchIconStyle = useAnimatedStyle(() => ({
      opacity: interpolate(progress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(progress.value, [0, 0.3], [1, 0.7], Extrapolation.CLAMP),
        },
      ],
    }));

    return (
      <View style={styles.toolbarWrap}>
        {searchActive ? (
          <Animated.View style={[styles.searchSlot, searchSlotStyle]} pointerEvents="auto">
            <View style={styles.searchBox}>
              <Icon name="magnify" size={20} color={theme.subText} />
              <TextInput
                ref={inputRef}
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                placeholder="Search contact and messages..."
                placeholderTextColor={theme.subText + '99'}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
              />
              <Pressable
                onPress={closeSearch}
                hitSlop={8}
                style={styles.searchCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close search">
                <Icon name="close" size={22} color={theme.primary} />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
            keyboardShouldPersistTaps="handled">
            {FILTERS.map(label => {
              const active = activeFilter === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => onFilterChange(label)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                  <Text
                    style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Animated.View style={searchIconStyle} pointerEvents={searchActive ? 'none' : 'auto'}>
            <Pressable
              style={styles.searchIconBtn}
              hitSlop={8}
              onPress={openSearch}
              accessibilityRole="button"
              accessibilityLabel="Search messages">
              <Icon name="magnify" size={22} color={theme.text} />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  },
);

ChatSearchToolbar.displayName = 'ChatSearchToolbar';
