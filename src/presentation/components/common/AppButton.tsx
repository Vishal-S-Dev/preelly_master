import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  title: string;
  onPress: () => void;
}

export const AppButton: React.FC<Props> = ({ title, onPress }) => {
  const theme = useAppTheme();

  return (
    <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: { padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 6 },
  text: { color: '#fff', fontWeight: '700' },
});
