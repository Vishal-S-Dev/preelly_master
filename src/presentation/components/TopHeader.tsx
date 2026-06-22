import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { FeedType } from '../../data/api/feedApi';
import BGIcon from '../../../assets/icons/glass_circle_bg.svg';

interface Props {
  muted: boolean;
  onToggleMute: () => void;
  selectedFeedType: FeedType;
  onSelectFeedType: (type: FeedType) => void;
  onPressSearch?: () => void;
}

export const TopHeader: React.FC<Props> = ({
  muted,
  onToggleMute,
  selectedFeedType,
  onSelectFeedType,
  onPressSearch,
}) => {
  const theme = useAppTheme();
  const isTrending = selectedFeedType === 'trending';

  return (
    <View style={styles.container}>
      <Pressable style={styles.circleButton} onPress={onToggleMute}>
        <Icon
          name={muted ? 'volume-off' : 'volume-high'}
          size={22}
          color={theme.background}
        />
      </Pressable>
      <View style={styles.centerTabs}>
        <Pressable onPress={() => onSelectFeedType('following')}>
          <Text
            style={[
              isTrending ? styles.inactiveLabel : styles.activeLabel,
              { color: isTrending ? theme.subText : theme.background },
            ]}
          >
            Following
          </Text>
        </Pressable>
        <Pressable onPress={() => onSelectFeedType('trending')}>
          <Text
            style={[
              isTrending ? styles.activeLabel : styles.inactiveLabel,
              { color: isTrending ? theme.background : theme.subText },
            ]}
          >
            Trending
          </Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.circleButton}
        onPress={onPressSearch}
        accessibilityRole="button"
        accessibilityLabel="Open search"
      >
        <Icon name="magnify" size={22} color={theme.background} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  centerTabs: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  activeLabel: { fontSize: 46 / 2, fontWeight: '700' },
  inactiveLabel: { fontSize: 36 / 2, fontWeight: '600' },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
