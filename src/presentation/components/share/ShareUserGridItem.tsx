import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ShareRecipient } from '../../../types/share.types';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  user: ShareRecipient;
  selected: boolean;
  onToggle: (user: ShareRecipient) => void;
}

export const ShareUserGridItem = memo<Props>(({ user, selected, onToggle }) => {
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1 : 0, { damping: 14 }) }],
    opacity: selected ? 1 : 0,
  }));

  return (
    <Pressable
      style={styles.cell}
      onPress={() => onToggle(user)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${user.name}, ${selected ? 'selected' : 'not selected'}`}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        {user.isOnline ? <View style={styles.onlineDot} /> : null}
        <Animated.View style={[styles.checkBadge, badgeStyle]}>
          <Icon name="check" size={14} color="#fff" />
        </Animated.View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {user.name}
      </Text>
    </Pressable>
  );
});

ShareUserGridItem.displayName = 'ShareUserGridItem';

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    maxWidth: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: SHARE_UI.chipBg,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SHARE_UI.checkBlue,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: SHARE_UI.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
