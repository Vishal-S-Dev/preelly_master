import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { ArchivedListing, ArchiveSortKey } from '../../../types/archives.types';
import { ArchiveListItem } from '../../components/archives/ArchiveListItem';
import { useMyArchives } from '../../hooks/useMyArchives';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { ARCHIVE_COLORS, archivesStyles } from './archivesStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'MyArchives'>;

const SORT_OPTIONS: Array<{ value: ArchiveSortKey; label: string }> = [
  { value: 'archived_newest', label: 'Newest archived' },
  { value: 'archived_oldest', label: 'Oldest archived' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export const MyArchivesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useStableSafeAreaInsets();
  const {
    items,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    search,
    setSearch,
    sort,
    setSort,
    busyId,
    refresh,
    loadMore,
    restore,
    remove,
    reload,
  } = useMyArchives();

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const onChooseSort = useCallback(() => {
    Alert.alert(
      'Sort archived ads',
      undefined,
      SORT_OPTIONS.map(opt => ({
        text: opt.value === sort ? `✓ ${opt.label}` : opt.label,
        onPress: () => setSort(opt.value),
      })).concat([{ text: 'Cancel', onPress: () => undefined }]),
    );
  }, [setSort, sort]);

  const onRestore = useCallback(
    (item: ArchivedListing) => {
      restore(item.id)
        .then(result => Alert.alert('Restored', result.message))
        .catch(err => Alert.alert('Unable to restore', err instanceof Error ? err.message : 'Failed to restore ad'));
    },
    [restore],
  );

  const onView = useCallback(
    (item: ArchivedListing) => {
      navigation.navigate('ProductDetail', { productId: item.id });
    },
    [navigation],
  );

  const onDelete = useCallback(
    (item: ArchivedListing) => {
      Alert.alert(
        'Delete Permanently',
        `Permanently delete "${item.title}"? This cannot be undone and the ad will be removed from My Archives.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: () => {
              remove(item.id)
                .then(result => Alert.alert('Deleted', result.message))
                .catch(err =>
                  Alert.alert('Unable to delete', err instanceof Error ? err.message : 'Failed to delete ad'),
                );
            },
          },
        ],
      );
    },
    [remove],
  );

  const onOpenMenu = useCallback(
    (item: ArchivedListing) => {
      Alert.alert(item.title, undefined, [
        { text: 'Restore Ad', onPress: () => onRestore(item) },
        { text: 'View Details', onPress: () => onView(item) },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => onDelete(item) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [onDelete, onRestore, onView],
  );

  const header = useMemo(
    () => (
      <View>
        <View style={[archivesStyles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={onBack} style={archivesStyles.headerBtn} hitSlop={8}>
            <Icon name="chevron-left" size={28} color={ARCHIVE_COLORS.text} />
          </Pressable>
          <Text style={archivesStyles.headerTitle}>My Archives</Text>
          <View style={archivesStyles.headerBtn} />
        </View>
        <Text style={archivesStyles.headerSubtitle}>
          Restore, review, or permanently delete your archived ads
        </Text>
        <View style={archivesStyles.toolbar}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search archived ads…"
            placeholderTextColor={ARCHIVE_COLORS.faint}
            style={archivesStyles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={reload}
          />
          <Pressable
            onPress={onChooseSort}
            style={archivesStyles.sortBtn}
            accessibilityRole="button"
            accessibilityLabel="Sort archived ads">
            <Icon name="sort-variant" size={20} color={ARCHIVE_COLORS.muted} />
          </Pressable>
        </View>
      </View>
    ),
    [insets.top, onBack, onChooseSort, reload, search, setSearch],
  );

  return (
    <View style={archivesStyles.screen}>
      {header}
      {loading && items.length === 0 ? (
        <View style={archivesStyles.center}>
          <ActivityIndicator color={ARCHIVE_COLORS.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={archivesStyles.center}>
          <Text style={archivesStyles.errorText}>{error}</Text>
          <Pressable onPress={reload}>
            <Text style={{ color: ARCHIVE_COLORS.primary, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={archivesStyles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={archivesStyles.emptyBody}>
              No archived ads. Ads you archive will appear here — active listings stay in My Ads.
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={ARCHIVE_COLORS.primary} style={archivesStyles.footerLoader} />
            ) : total > 0 ? (
              <Text style={[archivesStyles.cardMetaText, { textAlign: 'center', marginTop: 4 }]}>
                {items.length} of {total} archived
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <ArchiveListItem item={item} busy={busyId === item.id} onOpenMenu={() => onOpenMenu(item)} />
          )}
        />
      )}
    </View>
  );
};
