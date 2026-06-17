import React from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, View } from 'react-native';

export const Loader: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16 },
});
