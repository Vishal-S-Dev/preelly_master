import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';

interface Props {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export const SettingsMenuItem = memo<Props>(
  ({ icon, label, onPress, destructive = false, showChevron = true }) => {
    const { styles, colors } = useSettingsStyles();
    const tint = destructive ? colors.danger : colors.text;

    return (
      <Pressable
        style={destructive ? styles.logoutItem : styles.menuItem}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View style={styles.menuIconWrap}>
          <Icon name={icon} size={22} color={tint} />
        </View>
        <Text style={[styles.menuLabel, destructive && styles.logoutLabel]}>{label}</Text>
        {showChevron ? (
          <Icon name="chevron-right" size={22} color={colors.muted} style={styles.menuChevron} />
        ) : null}
      </Pressable>
    );
  },
);

SettingsMenuItem.displayName = 'SettingsMenuItem';
