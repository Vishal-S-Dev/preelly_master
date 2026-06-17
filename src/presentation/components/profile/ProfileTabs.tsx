import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ProfileTabKey } from '../../../types/profile.types';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  activeTab: ProfileTabKey;
  onChange: (tab: ProfileTabKey) => void;
  variant?: 'owner' | 'visitor';
}

const OWNER_TABS: Array<{ key: ProfileTabKey; icon: string }> = [
  { key: 'posts', icon: 'view-grid-plus' },
  { key: 'saved', icon: 'bookmark-outline' },
  { key: 'liked', icon: 'heart' },
];

const VISITOR_TABS: Array<{ key: ProfileTabKey; icon: string }> = [
  { key: 'posts', icon: 'view-grid-plus' },
];

export const ProfileTabs = memo<Props>(({ activeTab, onChange, variant = 'owner' }) => {
  const { styles, colors } = useProfileStyles();
  const TABS = variant === 'visitor' ? VISITOR_TABS : OWNER_TABS;
  const indicatorX = useSharedValue(activeTab === 'posts' ? 0 : activeTab === 'saved' ? 1 : 2);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 180 }),
  }));

  return (
    <View style={styles.tabsRow}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => {
              indicatorX.value = tab.key === 'posts' ? 0 : tab.key === 'saved' ? 1 : 2;
              onChange(tab.key);
            }}
            hitSlop={8}>
            <Icon
              name={tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.iconMuted}
            />
            {isActive ? (
              <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
});

ProfileTabs.displayName = 'ProfileTabs';
