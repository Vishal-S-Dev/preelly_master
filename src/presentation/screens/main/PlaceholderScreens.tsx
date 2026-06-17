import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const Screen: React.FC<{ title: string }> = ({ title }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
    </View>
  );
};

export const BookmarkScreen = () => <Screen title="Bookmarks" />;
export { CreateScreen } from './CreateTabScreen';
export { ChatScreen } from '../chat/ChatScreen';
export { ProfileScreen } from '../profile/ProfileScreen';

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: '700' },
});
