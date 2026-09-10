import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  /** Positioning only (e.g. `position: 'absolute', top, left`) — the pill's own visual
   * styling (color/shape/padding) is fixed, matching web's `PromotedBadge`. */
  style?: StyleProp<ViewStyle>;
}

/** Shown on a listing that currently occupies a paid, server-computed promoted slot —
 * shared between the search-results grid and the full-screen reel card so both surfaces
 * render the identical "Promoted" treatment web uses. */
export const PromotedBadge: React.FC<Props> = ({ style }) => (
  <View style={[styles.pill, style]} pointerEvents="none">
    <Icon name="bullhorn" size={10} color="#1F2937" />
    <Text style={styles.text}>Promoted</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.95)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: {
    color: '#1F2937',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
