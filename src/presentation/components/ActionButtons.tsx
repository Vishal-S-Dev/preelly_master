import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Send from '../../../assets/icons/send_fill.svg';
import ViewIcon from '../../../assets/icons/quick_view.svg';
import AvatarIcon from '../../../assets/icons/user.svg';

import { ProductApi } from '../../data/api/ProductApi';

const resolveAvatarUri = (avatar?: string): string | undefined => {
  const trimmed = avatar?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.startsWith('http') ? trimmed : ProductApi.withBase(trimmed);
};

interface Props {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  avatar?: string;
  onLike: () => void;
  onSave: () => void;
  onQuickView: () => void;
  onProfileView: () => void;
  onComment: () => void;
  onShare?: () => void;
}

const ActionMetric: React.FC<{ icon: string; value: number; color?: string }> = ({
  icon,
  value,
  color = '#fff',
}) => (
  <View style={styles.actionItem}>
    <Icon name={icon} color={color} size={31} />
    <Text style={styles.metric}>{value}</Text>
  </View>
);

export const ActionButtons: React.FC<Props> = ({
  likesCount,
  commentsCount,
  sharesCount,
  isLiked,
  isSaved,
  avatar,
  onLike,
  onSave,
  onQuickView,
  onProfileView,
  onComment,
  onShare,
}) => {
  const avatarUri = resolveAvatarUri(avatar);

  return (
  <View style={styles.container}>
    <Pressable onPress={onLike} style={styles.actionItem}>
      {isLiked ? (
        <Icon name={'heart'} color="#FF2D55" size={31} />
      ) : (
        <Icon name={'heart-outline'} color="#FFF" size={31} />
      )}
      {/*<Icon
        name={isLiked ? 'heart' : 'heart-outline'}
        color="#FF2D55"
        size={31}
      />*/}
      <Text style={styles.metric}>{likesCount}</Text>
    </Pressable>
    <Pressable onPress={onComment} style={styles.actionItem}>
      <Ionicons name="chatbubble-ellipses" color="#fff" size={31} />
      <Text style={styles.metric}>{commentsCount}</Text>
    </Pressable>
    {/*<ActionMetric icon="send-outline" value={sharesCount} />*/}
    <Pressable onPress={onShare} style={styles.actionItem} disabled={!onShare}>
      <Send width={45} height={45} />
      <Text style={styles.metric}>{sharesCount}</Text>
    </Pressable>
    <Pressable onPress={onQuickView} style={styles.actionItem}>
      <ViewIcon width={45} height={45} />
    </Pressable>
    <Pressable onPress={onSave} style={styles.actionItem}>
      <Icon
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        color="#fff"
        size={30}
      />
    </Pressable>
    {/*<Pressable onPress={onQuickView} style={styles.actionItem}>
      <Icon name={'scan-eye'} color="#fff" size={30} />
    </Pressable>*/}
    {/*<Pressable onPress={onProfileView}>
      <View style={styles.profileWrap}>
        <Image
          source={{ uri: avatar ?? 'https://i.pravatar.cc/200?img=3' }}
          style={styles.avatar}
        />
        <View style={styles.plusBadge}>
          <Icon name="plus" color="#fff" size={12} />
        </View>
      </View>
    </Pressable>*/}
    <Pressable onPress={onProfileView}>
      <View style={styles.profileWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <AvatarIcon width={45} height={45} />
        )}

        <View style={styles.plusBadge}>
          <Icon name="plus" color="#fff" size={12} />
        </View>
      </View>
    </Pressable>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 180,
    alignItems: 'center',
    zIndex: 8,
  },
  actionItem: { alignItems: 'center', marginBottom: 16 },
  metric: { color: '#fff', fontSize: 18 / 2, fontWeight: '700', marginTop: 6 },
  profileWrap: { marginTop: 6, position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#fff' },
  plusBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
