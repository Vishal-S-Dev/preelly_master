import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { SavedSearchListing } from '../../../types/savedSearch.types';
import { SavedSearchListItem } from '../../components/searches/SavedSearchListItem';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { SAVED_SEARCH_COLORS, savedSearchesStyles } from './savedSearchesStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'MySearches'>;

export const MySearchesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useStableSafeAreaInsets();
  const {
    items,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    busyId,
    refresh,
    open,
    toggleNotify,
    remove,
    reload,
  } = useSavedSearches();

  const onBack = useCallback(() => navigation.goBack(), [navigation]);
  const onOpenSearchScreen = useCallback(() => navigation.navigate('Search'), [navigation]);

  const onOpenSearch = useCallback(
    (item: SavedSearchListing) => {
      open(item.id);
      navigation.navigate('SearchFilter', item.reopenParams);
    },
    [navigation, open],
  );

  const onDelete = useCallback(
    (item: SavedSearchListing) => {
      Alert.alert('Delete Saved Search', `Remove "${item.title}" from My Search?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(item.id).catch(err =>
              Alert.alert(
                'Unable to delete',
                err instanceof Error ? err.message : 'Failed to delete saved search',
              ),
            );
          },
        },
      ]);
    },
    [remove],
  );

  const onOpenMore = useCallback(
    (item: SavedSearchListing) => {
      Alert.alert(item.title, undefined, [
        { text: 'Open', onPress: () => onOpenSearch(item) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [onDelete, onOpenSearch],
  );

  return (
    <View style={savedSearchesStyles.screen}>
      <View style={[savedSearchesStyles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={onBack} style={savedSearchesStyles.headerBtn} hitSlop={8}>
          <Icon name="chevron-left" size={28} color={SAVED_SEARCH_COLORS.text} />
        </Pressable>
        <Text style={savedSearchesStyles.headerTitle}>My Search</Text>
        <Pressable
          onPress={onOpenSearchScreen}
          style={savedSearchesStyles.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Search">
          <Icon name="magnify" size={24} color={SAVED_SEARCH_COLORS.text} />
        </Pressable>
      </View>

      {tabs.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          style={savedSearchesStyles.tabsScroll}
          contentContainerStyle={savedSearchesStyles.tabsContent}>
          {tabs.map(tab => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[savedSearchesStyles.tab, active ? savedSearchesStyles.tabActive : null]}>
                <Text style={active ? savedSearchesStyles.tabLabelActive : savedSearchesStyles.tabLabel}>
                  {tab.label}
                </Text>
                <Text style={savedSearchesStyles.tabCount}>{tab.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={savedSearchesStyles.center}>
          <ActivityIndicator color={SAVED_SEARCH_COLORS.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={savedSearchesStyles.center}>
          <Text style={savedSearchesStyles.errorText}>{error}</Text>
          <Pressable onPress={reload}>
            <Text style={{ color: SAVED_SEARCH_COLORS.primary, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          style={savedSearchesStyles.list}
          contentContainerStyle={savedSearchesStyles.listContent}
          contentInsetAdjustmentBehavior="never"
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={
            <Text style={savedSearchesStyles.emptyBody}>
              No saved searches yet. Run a search, then tap the bookmark icon to track new matching
              ads here.
            </Text>
          }
          renderItem={({ item }) => (
            <SavedSearchListItem
              item={item}
              busy={busyId === item.id}
              onOpen={() => onOpenSearch(item)}
              onToggleNotify={() => toggleNotify(item.id)}
              onOpenMore={() => onOpenMore(item)}
            />
          )}
        />
      )}
    </View>
  );
};
