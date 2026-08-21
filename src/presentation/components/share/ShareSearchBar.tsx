import React, { memo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SHARE_UI } from './shareSheetStyles';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onAddUser?: () => void;
  /** When provided, the search field becomes a non-editable trigger for a dedicated search
   * screen (Instagram-style) instead of filtering in place. */
  onPress?: () => void;
}

export const ShareSearchBar = memo<Props>(({ value, onChangeText, onAddUser, onPress }) => (
  <View style={styles.row}>
    <Pressable
      style={styles.searchWrap}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel="Search users">
      <Icon name="magnify" size={wp('5.5%')} color={SHARE_UI.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor={SHARE_UI.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        editable={!onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
        accessibilityElementsHidden={Boolean(onPress)}
      />
    </Pressable>
    <Pressable
      style={styles.addBtn}
      onPress={onAddUser}
      accessibilityLabel="Add user"
      hitSlop={8}>
      <Icon name="account-plus-outline" size={wp('6%')} color={SHARE_UI.text} />
    </Pressable>
  </View>
));

ShareSearchBar.displayName = 'ShareSearchBar';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    gap: wp('2.5%'),
    marginBottom: hp('1.4%'),
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    height: hp('5.2%'),
    gap: wp('2%'),
  },
  input: {
    flex: 1,
    fontSize: wp('4%'),
    color: SHARE_UI.text,
    paddingVertical: 0,
  },
  addBtn: {
    width: hp('5.2%'),
    height: hp('5.2%'),
    borderRadius: hp('2.6%'),
    borderWidth: 1,
    borderColor: SHARE_UI.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
