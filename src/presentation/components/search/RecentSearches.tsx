import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  items: string[];
  onPress: (keyword: string) => void;
  onRemove?: (keyword: string) => void;
  onClearAll?: () => void;
}

export const RecentSearches = memo<Props>(({ items, onPress, onRemove, onClearAll }) => {
  const theme = useAppTheme();

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Recent</Text>
        {onClearAll ? (
          <Pressable
            onPress={onClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear recent searches"
          >
            <Text style={[styles.clear, { color: theme.primary }]}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>
      {items.map(item => (
        <Pressable
          key={item}
          style={[styles.row, { borderBottomColor: theme.subText + '22' }]}
          onPress={() => onPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`Recent search ${item}`}
        >
          <Icon name="history" size={18} color={theme.subText} />
          <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
            {item}
          </Text>
          {onRemove ? (
            <Pressable
              onPress={() => onRemove(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item} from recent searches`}
            >
              <Icon name="close" size={18} color={theme.subText} />
            </Pressable>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
});

RecentSearches.displayName = 'RecentSearches';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  clear: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
