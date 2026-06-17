import React, { memo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onAddUser?: () => void;
}

export const ShareSearchBar = memo<Props>(({ value, onChangeText, onAddUser }) => (
  <View style={styles.row}>
    <View style={styles.searchWrap}>
      <Icon name="magnify" size={22} color={SHARE_UI.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor={SHARE_UI.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Search users"
      />
    </View>
    <Pressable
      style={styles.addBtn}
      onPress={onAddUser}
      accessibilityLabel="Add user"
      hitSlop={8}>
      <Icon name="account-plus-outline" size={24} color={SHARE_UI.text} />
    </Pressable>
  </View>
));

ShareSearchBar.displayName = 'ShareSearchBar';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: SHARE_UI.text,
    paddingVertical: 0,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SHARE_UI.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
