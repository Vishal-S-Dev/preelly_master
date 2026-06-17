/**
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppRegistry, StyleSheet } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const Root = () => (
  <GestureHandlerRootView style={styles.root}>
    <App />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

AppRegistry.registerComponent(appName, () => Root);
