import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';

export const OfflineToast: React.FC = () => {
  const isOnline = useAppSelector(state => state.app.isOnline);
  if (isOnline) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are offline. Check your internet connection.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '600' },
});
