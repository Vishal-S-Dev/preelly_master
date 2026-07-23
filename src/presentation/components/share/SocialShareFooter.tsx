import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SocialSharePlatform } from '../../../types/share.types';
import { SHARE_UI } from './shareSheetStyles';

interface PlatformItem {
  id: SocialSharePlatform;
  label: string;
  icon: string;
  color?: string;
  bg?: string;
}

const PLATFORMS: PlatformItem[] = [
  { id: 'share', label: 'Share', icon: 'send-outline' },
  { id: 'copy', label: 'Copy Link', icon: 'link-variant' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#fff', bg: '#25D366' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', color: '#fff', bg: '#E4405F' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#fff', bg: '#1877F2' },
  { id: 'messenger', label: 'Messenger', icon: 'facebook-messenger', color: '#fff', bg: '#0084FF' },
  { id: 'telegram', label: 'Telegram', icon: 'telegram', color: '#fff', bg: '#26A5E4' },
  { id: 'x', label: 'X', icon: 'twitter', color: '#fff', bg: '#000000' },
  { id: 'snapchat', label: 'Snapchat', icon: 'snapchat', color: '#000', bg: '#FFFC00' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', color: '#fff', bg: '#0A66C2' },
  { id: 'more', label: 'More', icon: 'dots-horizontal' },
];

interface Props {
  onPlatformPress: (platform: SocialSharePlatform) => void;
  compact?: boolean;
}

const COMPACT_PLATFORMS: PlatformItem[] = [
  { id: 'share', label: 'Share', icon: 'send-outline' },
  { id: 'copy', label: 'Copy Link', icon: 'link-variant' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#fff', bg: '#25D366' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', color: '#fff', bg: '#E4405F' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#fff', bg: '#1877F2' },
];

export const SocialShareFooter = memo<Props>(({ onPlatformPress, compact = false }) => {
  const platforms = compact ? COMPACT_PLATFORMS : PLATFORMS;
  return (
  <View style={styles.wrap}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {platforms.map(item => (
        <Pressable
          key={item.id}
          style={styles.item}
          onPress={() => onPlatformPress(item.id)}
          accessibilityRole="button"
          accessibilityLabel={item.label}>
          <View
            style={[
              styles.iconCircle,
              item.bg ? { backgroundColor: item.bg } : null,
            ]}>
            <Icon
              name={item.icon}
              size={22}
              color={item.color ?? SHARE_UI.text}
            />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
  );
});

SocialShareFooter.displayName = 'SocialShareFooter';

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SHARE_UI.border,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 4,
  },
  item: {
    width: 72,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F9FAFB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SHARE_UI.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: SHARE_UI.text,
    textAlign: 'center',
  },
});
