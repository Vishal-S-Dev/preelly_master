import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { Category } from '../../../types/category.types';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CategoryGridCard } from '../../components/createPost/CategoryGridCard';
import { DraftListItem } from '../../components/drafts/DraftListItem';
import { useCategories } from '../../hooks/useCategories';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useMyDrafts } from '../../hooks/useMyDrafts';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { DRAFT_COLORS, draftsStyles } from './draftsStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'MyDrafts'>;

/** Same alphabetical ordering as CategorySelectionScreen. */
const sortCategoriesAlphabetically = (list: Category[]): Category[] =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

export const MyDraftsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useStableSafeAreaInsets();
  const createPostStyles = useCreatePostStyles();
  const setCategory = useCreatePostStore(state => state.setCategory);
  const { data: categories = [], isLoading, isError, refetch, isFetching } = useCategories();
  const { draft, deleteDraft } = useMyDrafts();

  const displayCategories = useMemo(() => sortCategoriesAlphabetically(categories), [categories]);

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const goToCreatePost = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  const onSelectCategory = useCallback(
    (id: string, name: string) => {
      setCategory(id, name);
      navigation.navigate('CreatePost', {
        screen: 'CreatePostSubcategory',
        params: { parentId: id, title: name },
      });
    },
    [navigation, setCategory],
  );

  const onPreview = useCallback(() => {
    if (!draft) {
      return;
    }
    Alert.alert(draft.title, `${draft.categoryLabel}\n${draft.priceLabel}`, [
      { text: 'Close', style: 'cancel' },
      { text: 'Continue Editing', onPress: goToCreatePost },
    ]);
  }, [draft, goToCreatePost]);

  const onDelete = useCallback(() => {
    Alert.alert('Delete Draft', 'Delete this draft? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Draft', style: 'destructive', onPress: deleteDraft },
    ]);
  }, [deleteDraft]);

  const onOpenMenu = useCallback(() => {
    if (!draft) {
      return;
    }
    Alert.alert(draft.title, undefined, [
      { text: 'Continue Editing', onPress: goToCreatePost },
      { text: 'Preview', onPress: onPreview },
      { text: 'Delete Draft', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [draft, goToCreatePost, onDelete, onPreview]);

  return (
    <View style={draftsStyles.screen}>
      <View style={[draftsStyles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={onBack} style={draftsStyles.headerBtn} hitSlop={8}>
          <Icon name="chevron-left" size={28} color={DRAFT_COLORS.text} />
        </Pressable>
        <Text style={draftsStyles.headerTitle}>My Drafts</Text>
        <View style={draftsStyles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={draftsStyles.scrollContent}>
        {draft ? (
          <DraftListItem draft={draft} onOpenMenu={onOpenMenu} />
        ) : (
          <View style={draftsStyles.emptyWrap}>
            <Icon name="file-document-outline" size={40} color={DRAFT_COLORS.faint} />
            <Text style={draftsStyles.emptyTitle}>No drafts yet</Text>
            <Text style={draftsStyles.emptySubtitle}>
              Start a new ad below to create a draft automatically.
            </Text>
          </View>
        )}

        <Text style={draftsStyles.continueLabel}>Continuing posting new add</Text>

        {isLoading ? (
          <View style={createPostStyles.categoryGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[createPostStyles.skeleton, { width: '47%' }]} />
            ))}
          </View>
        ) : null}

        {isError ? (
          <Pressable
            style={createPostStyles.retryButton}
            onPress={() => refetch()}
            disabled={isFetching}>
            {isFetching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={createPostStyles.retryButtonText}>Retry</Text>
            )}
          </Pressable>
        ) : null}

        {!isLoading ? (
          <View style={createPostStyles.categoryGrid}>
            {displayCategories.map((item, index) => (
              <Animated.View
                key={item._id}
                entering={FadeInDown.delay(index * 40).duration(300)}
                style={{ width: '47%' }}>
                <CategoryGridCard
                  category={item}
                  index={index}
                  selected={false}
                  onPress={() => onSelectCategory(item._id, item.name)}
                  styles={createPostStyles}
                />
              </Animated.View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
