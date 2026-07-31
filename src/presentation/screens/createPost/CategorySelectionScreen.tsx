import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCreatePostStore } from '../../../store/createPostStore';
import { Category } from '../../../types/category.types';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { CategoryGridCard } from '../../components/createPost/CategoryGridCard';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { useCategories } from '../../hooks/useCategories';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostCategory'>;

/** Active sort: alphabetical by category name. */
const sortCategoriesAlphabetically = (list: Category[]): Category[] =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

/**
 * Default / API order (xOrder → sortOrder → order, then name).
 * Uncomment and use instead of sortCategoriesAlphabetically to restore default ordering.
 */
// const sortCategoriesByDefaultOrder = (list: Category[]): Category[] =>
//   [...list].sort((a, b) => {
//     const aOrder = a.xOrder ?? a.sortOrder ?? a.order ?? 999;
//     const bOrder = b.xOrder ?? b.sortOrder ?? b.order ?? 999;
//     if (aOrder !== bOrder) {
//       return aOrder - bOrder;
//     }
//     return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
//   });

export const CategorySelectionScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryId, setCategory } = useCreatePostStore();
  const { data: categories = [], isLoading, isError, refetch, isFetching } = useCategories();

  const displayCategories = useMemo(
    () => sortCategoriesAlphabetically(categories),
    // To use default API order instead:
    // () => sortCategoriesByDefaultOrder(categories),
    [categories],
  );

  const onSelect = useCallback(
    (id: string, name: string) => {
      setCategory(id, name);
      navigation.navigate('CreatePostSubcategory', { parentId: id, title: name });
    },
    [navigation, setCategory],
  );

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        backgroundColor={styles.screen.backgroundColor}
        showTitleInHeader={false}
        onBack={() => navigation.getParent()?.goBack()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, styles.categoryScrollContent]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Let's get started!</Text>
        <Text style={styles.subtitle}>Select the area that suits your ad best.</Text>
        {isLoading ? (
          <View style={styles.categoryGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.skeleton, { width: '47%' }]} />
            ))}
          </View>
        ) : null}
        {isError ? (
          <Pressable style={styles.retryButton} onPress={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.retryButtonText}>Retry</Text>
            )}
          </Pressable>
        ) : null}
        {!isLoading ? (
          <View style={styles.categoryGrid}>
            {displayCategories.map((item, index) => (
              <Animated.View
                key={item._id}
                entering={FadeInDown.delay(index * 40).duration(300)}
                style={{ width: '47%' }}>
                <CategoryGridCard
                  category={item}
                  index={index}
                  selected={categoryId === item._id}
                  onPress={() => onSelect(item._id, item.name)}
                  styles={styles}
                />
              </Animated.View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
